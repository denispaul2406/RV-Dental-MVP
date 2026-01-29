"use client";

import { useState, useEffect } from "react";
import UploadZone from "@/components/dashboard/UploadZone";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

interface Patient {
    id: string;
    patientId?: string;
    name: string;
    age: string;
    gender: string;
    email?: string;
    phone?: string;
}

export default function NewScanPage() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientName, setPatientName] = useState("");
    const [patientGender, setPatientGender] = useState("");
    const [patientAge, setPatientAge] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedPatientId = searchParams.get("patientId");

    useEffect(() => {
        if (!user) return;
        const loadPatients = async () => {
            const snap = await getDocs(collection(db, "patients", user.uid, "patientList"));
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Patient));
            setPatients(list);
            setLoadingPatients(false);
            if (preselectedPatientId) {
                const p = list.find((x) => x.id === preselectedPatientId);
                if (p) {
                    setSelectedPatient(p);
                    setPatientName(p.name);
                    setPatientAge(p.age);
                    setPatientGender(p.gender);
                }
            }
        };
        loadPatients();
    }, [user, preselectedPatientId]);

    const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        if (!id) {
            setSelectedPatient(null);
            setPatientName("");
            setPatientAge("");
            setPatientGender("");
            return;
        }
        const p = patients.find((x) => x.id === id);
        if (p) {
            setSelectedPatient(p);
            setPatientName(p.name);
            setPatientAge(p.age);
            setPatientGender(p.gender);
        }
    };

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
    };

    const startAnalysis = async () => {
        if (!file || !user) return;
        if (!selectedPatient) {
            alert("Please select a patient.");
            return;
        }
        setAnalyzing(true);

        try {
            const timestamp = Date.now();
            const imageRef = ref(storage, `scans/${user.uid}/${timestamp}_${file.name}`);
            const uploadSnapshot = await uploadBytes(imageRef, file);
            const imageUrl = await getDownloadURL(uploadSnapshot.ref);

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Analysis failed. Please try again.");
            }

            const data = await res.json();
            if (!data.landmarks || Object.keys(data.landmarks).length === 0) {
                throw new Error("No landmarks detected. Please try again with a clearer image.");
            }

            const scanData = {
                timestamp: serverTimestamp(),
                patient: patientName,
                patientAge: patientAge,
                patientGender: patientGender,
                imageUrl,
                landmarks: data.landmarks,
                analysis: {
                    anb: data.analysis.anb,
                    overjet: data.analysis.overjet || 0,
                    suitable: data.analysis.suitable,
                    message: data.analysis.message,
                },
            };

            // Save scan under patient subcollection (Option A)
            const patientScansRef = collection(db, "patients", user.uid, "patientList", selectedPatient.id, "scans");
            const docRef = await addDoc(patientScansRef, scanData);

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageSrc = e.target?.result as string;
                sessionStorage.setItem("current_analysis_image", imageSrc);
                sessionStorage.setItem("current_analysis_landmarks", JSON.stringify(data.landmarks));
                sessionStorage.setItem("current_analysis_patient_name", patientName);
                sessionStorage.setItem("current_analysis_patient_age", patientAge);
                sessionStorage.setItem("current_analysis_patient_gender", patientGender);
                sessionStorage.setItem("current_analysis_overjet", String(data.analysis.overjet || 0));
                sessionStorage.setItem("current_analysis_anb", String(data.analysis.anb || 0));
                router.push(`/dashboard/analysis?patientId=${selectedPatient.id}&scanId=${docRef.id}`);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            setAnalyzing(false);
            alert(error instanceof Error ? error.message : "Analysis failed. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    New Scan
                </h1>
                <p className="text-muted-foreground mt-1">
                    Select a patient, upload a Lateral Cephalogram, then run analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-lg font-heading font-semibold mb-4">1. Select Patient</h2>
                        <select
                            value={selectedPatient?.id ?? ""}
                            onChange={handlePatientSelect}
                            className="w-full p-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                            disabled={loadingPatients}
                        >
                            <option value="">— Select patient —</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.patientId ?? p.id} — {p.name}
                                </option>
                            ))}
                        </select>
                        {loadingPatients && <p className="text-xs text-muted-foreground mt-2">Loading patients…</p>}
                    </div>

                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-lg font-heading font-semibold mb-4">2. Upload Image</h2>
                        <UploadZone onFileSelect={handleFileSelect} />
                    </div>

                    <div className="glass-card p-6 rounded-2xl space-y-4">
                        <h2 className="text-lg font-heading font-semibold border-b border-border/50 pb-2">Patient Details</h2>
                        <p className="text-sm text-muted-foreground">Filled from selected patient. Edit if needed.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Name</label>
                                <input
                                    type="text"
                                    placeholder="Select patient to fill"
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
                                        placeholder="—"
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
                        <h2 className="text-lg font-heading font-semibold mb-4">3. Review & Analyze</h2>
                        <div className="flex-1 bg-muted/20 rounded-xl border border-dashed border-border/50 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                            {!file ? (
                                <div className="text-muted-foreground text-sm text-center p-4">Preview will appear here</div>
                            ) : (
                                <img src={URL.createObjectURL(file)} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
                            )}
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={startAnalysis}
                                disabled={!file || analyzing || !selectedPatient || !patientName}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Analyzing…
                                    </>
                                ) : (
                                    <>
                                        Begin Analysis <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                            {!selectedPatient && <p className="text-xs text-amber-500 text-center mt-2">Please select a patient.</p>}
                            {selectedPatient && !file && <p className="text-xs text-muted-foreground text-center mt-2">Please upload a file.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
