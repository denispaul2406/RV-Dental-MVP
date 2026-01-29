"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, collection, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { ArrowLeft, Calendar, User, Loader2, Plus } from "lucide-react";

interface Patient {
    id: string;
    patientId?: string;
    name: string;
    age: string;
    gender: string;
    email?: string;
    phone?: string;
    notes?: string;
    createdAt: Timestamp;
}

type ScanSource = "patient" | "legacy";

interface ScanItem {
    id: string;
    source: ScanSource;
    patientDocId?: string;
    timestamp: Timestamp;
    imageUrl?: string;
    patient?: string;
    analysis?: { anb?: number; overjet?: number; suitable?: boolean };
}

export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const patientDocId = params.id as string;
    const [patient, setPatient] = useState<Patient | null>(null);
    const [patientScans, setPatientScans] = useState<ScanItem[]>([]);
    const [legacyScans, setLegacyScans] = useState<ScanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingScans, setLoadingScans] = useState(true);

    useEffect(() => {
        if (!user || !patientDocId) return;
        const patientRef = doc(db, "patients", user.uid, "patientList", patientDocId);
        const unsubPatient = onSnapshot(patientRef, (snap) => {
            if (snap.exists()) {
                setPatient({ id: snap.id, ...snap.data() } as Patient);
            } else {
                setPatient(null);
            }
            setLoading(false);
        });
        return () => unsubPatient();
    }, [user, patientDocId]);

    useEffect(() => {
        if (!user || !patientDocId) return;
        setLoadingScans(true);
        const patientScansRef = collection(db, "patients", user.uid, "patientList", patientDocId, "scans");
        const unsubPatientScans = onSnapshot(patientScansRef, (snap) => {
            const list = snap.docs.map((d) => ({
                id: d.id,
                source: "patient" as ScanSource,
                patientDocId: patientDocId,
                ...d.data(),
            })) as ScanItem[];
            setPatientScans(list);
            setLoadingScans(false);
        });
        return () => unsubPatientScans();
    }, [user, patientDocId]);

    useEffect(() => {
        if (!user || !patient) return;
        const legacyRef = collection(db, "patients", user.uid, "scans");
        const unsubLegacy = onSnapshot(legacyRef, (snap) => {
            const list = snap.docs
                .map((d) => ({ id: d.id, source: "legacy" as ScanSource, ...d.data() } as ScanItem))
                .filter((s) => s.patient === patient.name);
            setLegacyScans(list);
        });
        return () => unsubLegacy();
    }, [user, patient]);

    const scans = [...patientScans, ...legacyScans].sort((a, b) => {
        const ta = a.timestamp?.toMillis?.() ?? 0;
        const tb = b.timestamp?.toMillis?.() ?? 0;
        return tb - ta;
    });

    if (loading || !patient) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/patients"
                    className="p-2 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-heading font-bold">{patient.name}</h1>
                    <p className="text-muted-foreground">
                        {patient.patientId ?? "—"} • {patient.age} yrs • {patient.gender}
                    </p>
                </div>
                <Link
                    href={`/dashboard/new?patientId=${patient.id}`}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90"
                >
                    <Plus size={18} />
                    New Scan
                </Link>
            </div>

            <div className="glass-card p-6 rounded-2xl">
                <h2 className="font-heading font-semibold text-lg mb-4">Patient Info</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {patient.email && <p><span className="text-muted-foreground">Email:</span> {patient.email}</p>}
                    {patient.phone && <p><span className="text-muted-foreground">Phone:</span> {patient.phone}</p>}
                    {patient.notes && <p className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {patient.notes}</p>}
                </div>
            </div>

            <div>
                <h2 className="font-heading font-semibold text-lg mb-4">Scans</h2>
                {loadingScans ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : scans.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
                        <p>No scans yet for this patient.</p>
                        <Link href={`/dashboard/new?patientId=${patient.id}`} className="mt-2 inline-block text-primary hover:underline">
                            Add first scan →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scans.map((scan) => (
                            <Link
                                key={scan.source === "patient" ? `p-${scan.id}` : `l-${scan.id}`}
                                href={
                                    scan.source === "patient"
                                        ? `/dashboard/analysis?patientId=${patientDocId}&scanId=${scan.id}`
                                        : `/dashboard/analysis?id=${scan.id}`
                                }
                                className="glass-card rounded-2xl overflow-hidden hover:border-primary/50 transition-colors block"
                            >
                                <div className="relative h-40 bg-muted">
                                    {scan.imageUrl ? (
                                        <img src={scan.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 font-bold">X-RAY</div>
                                    )}
                                    <div className="absolute top-2 right-2 px-2 py-1 glass rounded text-xs font-semibold">
                                        ANB {scan.analysis?.anb?.toFixed(1) ?? "?"}°
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar size={12} />
                                        {scan.timestamp?.toDate?.()?.toLocaleDateString() ?? "—"}
                                    </div>
                                    {scan.source === "legacy" && (
                                        <span className="text-xs text-amber-500 mt-1">Legacy scan</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
