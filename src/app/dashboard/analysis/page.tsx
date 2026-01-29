"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import ImageViewer from "@/components/diagnostics/ImageViewer";
import SuitabilityMeter from "@/components/diagnostics/SuitabilityMeter";
import { calculateANB, Point } from "@/lib/geometry";
import { Save, ArrowLeft, RefreshCw, Loader2, CheckCircle2, XCircle, Download } from "lucide-react";
import { generatePDFReport } from "@/lib/pdfExport";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";

function AnalysisPageContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const legacyScanId = searchParams.get("id");
    const patientDocId = searchParams.get("patientId");
    const patientScanId = searchParams.get("scanId");
    const scanId = patientScanId ?? legacyScanId;

    const [landmarks, setLandmarks] = useState<Record<string, Point>>({});
    const [imageSrc, setImageSrc] = useState<string>("https://placehold.co/800x1000/111/FFF?text=Lateral+Ceph+X-Ray");
    const [anb, setAnb] = useState(0);
    const [overjet, setOverjet] = useState(0);
    const [isSuitable, setIsSuitable] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [patientDetails, setPatientDetails] = useState({ name: "", age: "", gender: "" });
    const [isExistingScan, setIsExistingScan] = useState(false);
    const [geminiAnb, setGeminiAnb] = useState<number | null>(null); // Store Gemini's original ANB
    const [landmarksManuallyAdjusted, setLandmarksManuallyAdjusted] = useState(false); // Track if user adjusted landmarks

    // Load data from Firestore (legacy or patient subcollection) or sessionStorage
    useEffect(() => {
        const loadData = async () => {
            if (scanId && user) {
                try {
                    const scanRef =
                        patientDocId && patientScanId
                            ? doc(db, "patients", user.uid, "patientList", patientDocId, "scans", patientScanId)
                            : doc(db, "patients", user.uid, "scans", scanId);
                    const scanDoc = await getDoc(scanRef);
                    if (scanDoc.exists()) {
                        const data = scanDoc.data();
                        setIsExistingScan(true);
                        setPatientDetails({
                            name: data.patient || "Unknown",
                            age: data.patientAge || "",
                            gender: data.patientGender || "",
                        });
                        if (data.imageUrl) setImageSrc(data.imageUrl);
                        if (data.landmarks) setLandmarks(data.landmarks);
                        if (data.analysis) {
                            const geminiAnbValue = data.analysis.anb || 0;
                            setGeminiAnb(geminiAnbValue);
                            setAnb(geminiAnbValue);
                            setOverjet(data.analysis.overjet || 0);
                            setIsSuitable(data.analysis.suitable || false);
                        }
                    }
                } catch (error) {
                    console.error("Error loading scan:", error);
                }
            } else if (!scanId) {
                // Load from sessionStorage (new analysis)
                const storedImage = sessionStorage.getItem("current_analysis_image");
                const storedLandmarks = sessionStorage.getItem("current_analysis_landmarks");
                const storedOverjet = sessionStorage.getItem("current_analysis_overjet");

                const storedName = sessionStorage.getItem("current_analysis_patient_name");
                const storedAge = sessionStorage.getItem("current_analysis_patient_age");
                const storedGender = sessionStorage.getItem("current_analysis_patient_gender");

                setPatientDetails({
                    name: storedName || "Unknown",
                    age: storedAge || "",
                    gender: storedGender || ""
                });

                if (storedImage) setImageSrc(storedImage);
                if (storedLandmarks) {
                    try {
                        setLandmarks(JSON.parse(storedLandmarks));
                    } catch (e) {
                        console.error("Failed to parse landmarks", e);
                    }
                }
                if (storedOverjet) {
                    setOverjet(parseFloat(storedOverjet));
                }
                
                // Get Gemini's ANB from sessionStorage if available
                const storedAnb = sessionStorage.getItem("current_analysis_anb");
                if (storedAnb) {
                    const anbValue = parseFloat(storedAnb);
                    setGeminiAnb(anbValue);
                    setAnb(anbValue);
                }
            }
            setLoading(false);
        };

        loadData();
    }, [scanId, user, patientDocId, patientScanId]);

    // Initialize ANB from Gemini's value when data loads (only once)
    useEffect(() => {
        if (geminiAnb !== null && !landmarksManuallyAdjusted) {
            setAnb(geminiAnb);
            const ageNum = parseInt(patientDetails.age);
            const ageSuitable = !isNaN(ageNum) && ageNum >= 9 && ageNum <= 15;
            setIsSuitable(geminiAnb > 4.5 && overjet > 5.0 && ageSuitable);
        }
    }, [geminiAnb, landmarksManuallyAdjusted, patientDetails.age, overjet]); // Only run when geminiAnb is set initially
    
    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (recalculationTimerRef.current) {
                clearTimeout(recalculationTimerRef.current);
            }
        };
    }, []);

    // Debounce timer for ANB recalculation
    const recalculationTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLandmarkChange = useCallback((name: string, newPoint: Point) => {
        // Mark that user has manually adjusted landmarks (only once)
        setLandmarksManuallyAdjusted(true);
        
        // Update landmarks immediately (for visual feedback)
        setLandmarks(prev => ({
            ...prev,
            [name]: newPoint
        }));
        
        // Debounce ANB recalculation to prevent excessive updates during drag
        if (recalculationTimerRef.current) {
            clearTimeout(recalculationTimerRef.current);
        }
        
        recalculationTimerRef.current = setTimeout(() => {
            setLandmarks(currentLandmarks => {
                const { S, N, A, B } = currentLandmarks;
                if (S && N && A && B && Object.keys(currentLandmarks).length === 4) {
                    const angle = calculateANB(S, N, A, B);
                    const newAnb = parseFloat(angle.toFixed(2));
                    const ageNum = parseInt(patientDetails.age);
                    const ageSuitable = !isNaN(ageNum) && ageNum >= 9 && ageNum <= 15;
                    const newSuitable = newAnb > 4.5 && overjet > 5.0 && ageSuitable;
                    
                    setAnb(newAnb);
                    setIsSuitable(newSuitable);
                }
                return currentLandmarks;
            });
        }, 100); // Debounce for 100ms
    }, [patientDetails.age, overjet]);

    const handleSave = async () => {
        if (!user) return alert("You must be logged in to save.");
        if (!scanId) return alert("No scan ID found.");
        setSaving(true);
        try {
            const scanRef =
                patientDocId && patientScanId
                    ? doc(db, "patients", user.uid, "patientList", patientDocId, "scans", patientScanId)
                    : doc(db, "patients", user.uid, "scans", scanId);
            await updateDoc(scanRef, {
                patient: patientDetails.name,
                patientAge: patientDetails.age,
                patientGender: patientDetails.gender,
                landmarks,
                analysis: {
                    anb,
                    overjet,
                    suitable: isSuitable,
                    message: isSuitable ? "Functional Recommended" : "Routine",
                },
                updatedAt: serverTimestamp(),
            });
            alert("Analysis updated successfully!");
        } catch (e) {
            console.error("Error saving:", e);
            alert("Failed to save record.");
        } finally {
            setSaving(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            await generatePDFReport({
                patientName: patientDetails.name,
                patientAge: patientDetails.age,
                patientGender: patientDetails.gender,
                anb,
                overjet,
                isSuitable,
                landmarks,
                imageSrc,
                timestamp: new Date()
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF report.");
        }
    };

    const ageNum = parseInt(patientDetails.age);
    const ageSuitable = !isNaN(ageNum) && ageNum >= 9 && ageNum <= 15;
    const anbSuitable = anb > 4.5;
    const overjetSuitable = overjet > 5.0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    // Check if we have valid landmarks from Gemini
    const hasLandmarks = landmarks && Object.keys(landmarks).length === 4 && 
                        landmarks.S && landmarks.N && landmarks.A && landmarks.B;

    return (
        <div className="flex flex-col min-h-0 h-[calc(100vh-4rem)] gap-4">
            <div className="flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-4">
                    <Link
                        href={patientDocId ? `/dashboard/patients/${patientDocId}` : "/dashboard/patients"}
                        className="p-2 hover:bg-accent/10 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-heading font-bold">Analysis Results</h1>
                        <p className="text-sm text-muted-foreground">{patientDetails.name} {patientDetails.age ? `• ${patientDetails.age} yrs` : ""} {patientDetails.gender ? `• ${patientDetails.gender}` : ""}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-semibold hover:bg-accent/5 flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export PDF
                    </button>
                    {isExistingScan && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                            {saving ? "Saving..." : "Update Record"}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
                {/* Main Viewer - fills available height so X-ray fits without scroll */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 glass-card p-1 rounded-2xl flex flex-col min-h-0 overflow-hidden"
                >
                    <div className="flex-1 min-h-0 bg-black/40 rounded-xl overflow-hidden relative flex flex-col">
                        {hasLandmarks ? (
                            <ImageViewer
                                imageSrc={imageSrc}
                                landmarks={landmarks}
                                onLandmarkChange={handleLandmarkChange}
                                fillContainer
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                                <div className="text-center space-y-4">
                                    <div className="text-2xl font-bold">No Landmarks Detected</div>
                                    <p className="text-muted-foreground max-w-md">
                                        The AI analysis did not detect landmarks. This could be due to:
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md">
                                        <li>• Image quality is too low</li>
                                        <li>• Image is not a lateral cephalogram</li>
                                        <li>• AI model failed to process the image</li>
                                    </ul>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        Please try uploading a clearer lateral cephalogram image.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Instructions Overlay */}
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-xs text-white max-w-xs pointer-events-none">
                            Tip: Drag the dots (S, N, A, B) to fine-tune the landmark positions. Metrics update in real-time.
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar Metrics */}
                <div className="space-y-6 overflow-y-auto pr-2">
                    <SuitabilityMeter
                        val={anb}
                        label="ANB Angle"
                        isSuitable={anbSuitable}
                    />

                    {/* Overjet Display */}
                    <div className="glass-card p-6 rounded-2xl">
                        <div className="text-center">
                            <div className="text-3xl font-bold mb-1">{overjet.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground mb-2">mm</div>
                            <div className={`text-sm font-semibold ${overjetSuitable ? "text-green-500" : "text-yellow-500"}`}>
                                Overjet {overjetSuitable ? "✓ Suitable" : "✗ Below Threshold"}
                            </div>
                        </div>
                    </div>

                    {/* Clinical Criteria Checklist - highlighted */}
                    <div className="glass-card p-6 rounded-2xl space-y-4 bg-primary/5 border-2 border-primary/30 ring-1 ring-primary/10">
                        <h3 className="font-heading font-semibold text-lg border-b border-primary/20 pb-2 text-primary">Clinical Criteria</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">ANB &gt; 4.5°</span>
                                {anbSuitable ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Overjet &gt; 5mm</span>
                                {overjetSuitable ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Age 9-15 years</span>
                                {ageSuitable ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                        </div>
                        <div className="pt-3 border-t border-border">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Overall Suitability</span>
                                <span className={`font-bold ${isSuitable ? "text-green-500" : "text-yellow-500"}`}>
                                    {isSuitable ? "Suitable" : "Not Suitable"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl space-y-4">
                        <h3 className="font-heading font-semibold text-lg border-b border-border pb-2">Analysis Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Skeletal Class</span>
                                <span className="font-mono font-medium">{anb > 4.5 ? "Class II" : anb < 0 ? "Class III" : "Class I"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">ANB Angle</span>
                                <span className="font-mono font-medium">{anb.toFixed(2)}°</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Overjet</span>
                                <span className="font-mono font-medium">{overjet.toFixed(2)}mm</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl bg-primary/5 border-primary/20">
                        <h3 className="font-semibold text-sm text-primary mb-2">AI Recommendation</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {isSuitable
                                ? "The analysis suggests a skeletal Class II relationship suitable for functional appliance therapy. Monitor mandibular growth response."
                                : "The skeletal pattern does not fully meet the criteria for functional appliance therapy. Consider alternative mechanics or extraction therapy."
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Definitions - Landmarks & metrics for easier understanding */}
            <details className="glass-card rounded-2xl overflow-hidden border border-border/50 group">
                <summary className="px-6 py-4 cursor-pointer list-none font-heading font-semibold text-lg border-b border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Definitions — Landmarks &amp; metrics
                </summary>
                <div className="p-6 pt-4 space-y-6 text-sm text-muted-foreground">
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">Landmarks (S, N, A, B)</h4>
                        <ul className="space-y-1.5">
                            <li><strong className="text-foreground">S (Sella):</strong> The center of the sella turcica — the bony saddle in the sphenoid bone. Reference point for the cranial base.</li>
                            <li><strong className="text-foreground">N (Nasion):</strong> The most anterior point of the frontonasal suture where the nose meets the forehead. Used to define the upper face.</li>
                            <li><strong className="text-foreground">A (Point A / Subspinale):</strong> The deepest midline point on the anterior curvature of the maxilla (upper jaw), between the nose and upper incisors.</li>
                            <li><strong className="text-foreground">B (Point B / Supramentale):</strong> The deepest midline point on the anterior curvature of the mandible (lower jaw), between the lower incisors and chin.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">ANB Angle</h4>
                        <p>The angle between points A, N, and B. It describes the sagittal relationship between the maxilla and mandible. <strong className="text-foreground">Class I:</strong> 0°–4°; <strong className="text-foreground">Class II:</strong> &gt;4° (maxilla ahead); <strong className="text-foreground">Class III:</strong> &lt;0° (mandible ahead). Used here to assess suitability for functional appliance therapy.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">Overjet</h4>
                        <p>The horizontal distance (in mm) between the upper and lower incisors — how far the upper front teeth protrude ahead of the lower. Positive overjet is normal; increased overjet is common in Class II and is one criterion for functional appliance consideration.</p>
                    </div>
                </div>
            </details>
        </div>
    );
}

export default function AnalysisPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        }>
            <AnalysisPageContent />
        </Suspense>
    );
}
