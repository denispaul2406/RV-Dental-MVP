/* eslint-disable */
"use client";

import { useState } from "react";
import UploadZone from "@/components/dashboard/UploadZone";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function NewScanPage() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [patientName, setPatientName] = useState("");
    const [patientGender, setPatientGender] = useState("");
    const [patientAge, setPatientAge] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const router = useRouter();

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
    };

    const startAnalysis = async () => {
        if (!file || !user) return;
        setAnalyzing(true);

        try {
            // 1. Upload image to Firebase Storage
            const timestamp = Date.now();
            const imageRef = ref(storage, `scans/${user.uid}/${timestamp}_${file.name}`);
            const uploadSnapshot = await uploadBytes(imageRef, file);
            const imageUrl = await getDownloadURL(uploadSnapshot.ref);

            // 2. Create a FormData instance for analysis
            const formData = new FormData();
            formData.append("file", file);

            // 3. Call the API for analysis
            const res = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Analysis failed. Please try again.");
            }

            const data = await res.json();
            
            // Ensure we have valid landmarks from Gemini
            if (!data.landmarks || Object.keys(data.landmarks).length === 0) {
                throw new Error("No landmarks detected. Please try again with a clearer image.");
            }

            // 4. Save analysis data to Firestore
            const scanData = {
                timestamp: serverTimestamp(),
                patient: patientName,
                patientAge: patientAge,
                patientGender: patientGender,
                imageUrl: imageUrl,
                landmarks: data.landmarks,
                analysis: {
                    anb: data.analysis.anb,
                    overjet: data.analysis.overjet || 0,
                    suitable: data.analysis.suitable,
                    message: data.analysis.message
                }
            };

            const docRef = await addDoc(collection(db, "patients", user.uid, "scans"), scanData);

            // 5. Store in sessionStorage for immediate display and redirect
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageSrc = e.target?.result as string;
                sessionStorage.setItem("current_analysis_image", imageSrc);
                sessionStorage.setItem("current_analysis_landmarks", JSON.stringify(data.landmarks));
                sessionStorage.setItem("current_analysis_patient_name", patientName);
                sessionStorage.setItem("current_analysis_patient_age", patientAge);
                sessionStorage.setItem("current_analysis_patient_gender", patientGender);
                sessionStorage.setItem("current_analysis_overjet", String(data.analysis.overjet || 0));
                sessionStorage.setItem("current_analysis_anb", String(data.analysis.anb || 0)); // Store Gemini's ANB
                router.push(`/dashboard/analysis?id=${docRef.id}`);
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error(error);
            setAnalyzing(false);
            const errorMessage = error instanceof Error ? error.message : "Analysis failed. Please try again.";
            alert(errorMessage);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    New Analysis
                </h1>
                <p className="text-muted-foreground mt-1">
                    Upload a Lateral Cephalogram to begin AI diagnostic.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-lg font-heading font-semibold mb-4">1. Upload Image</h2>
                        <UploadZone onFileSelect={handleFileSelect} />
                    </div>

                    <div className="glass-card p-6 rounded-2xl space-y-4">
                        <h2 className="text-lg font-heading font-semibold border-b border-border/50 pb-2">Patient Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Patient Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Age</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 12"
                                        value={patientAge}
                                        onChange={(e) => setPatientAge(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Gender</label>
                                    <select
                                        value={patientGender}
                                        onChange={(e) => setPatientGender(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
                        <h2 className="text-lg font-heading font-semibold mb-4">2. Review & Analyze</h2>

                        <div className="flex-1 bg-muted/20 rounded-xl border border-dashed border-border/50 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                            {!file ? (
                                <div className="text-muted-foreground text-sm text-center p-4">
                                    Preview will appear here
                                </div>
                            ) : (
                                // In real app, create object URL. 
                                // For this demo, we can't easily read local file path for Image component without URL.createObjectURL
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="Preview"
                                    className="absolute inset-0 w-full h-full object-contain"
                                />
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={startAnalysis}
                                disabled={!file || analyzing || !patientName}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Analyzing Geometry...
                                    </>
                                ) : (
                                    <>
                                        Begin Analysis <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                            {!file && <p className="text-xs text-muted-foreground text-center mt-2">Please upload a file to proceed.</p>}
                            {file && !patientName && <p className="text-xs text-amber-500 text-center mt-2">Please enter patient name.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
