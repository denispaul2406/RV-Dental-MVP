"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash2, User, X, Save } from "lucide-react";
import Link from "next/link";

interface Patient {
    id: string;
    name: string;
    age: string;
    gender: string;
    email?: string;
    phone?: string;
    notes?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export default function PatientsPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "",
        email: "",
        phone: "",
        notes: ""
    });

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "patients", user.uid, "patientList"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const patientData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Patient));
            setPatients(patientData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone?.includes(searchQuery)
    );

    const handleOpenModal = (patient?: Patient) => {
        if (patient) {
            setEditingPatient(patient);
            setFormData({
                name: patient.name,
                age: patient.age,
                gender: patient.gender,
                email: patient.email || "",
                phone: patient.phone || "",
                notes: patient.notes || ""
            });
        } else {
            setEditingPatient(null);
            setFormData({
                name: "",
                age: "",
                gender: "",
                email: "",
                phone: "",
                notes: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPatient(null);
        setFormData({
            name: "",
            age: "",
            gender: "",
            email: "",
            phone: "",
            notes: ""
        });
    };

    const handleSave = async () => {
        if (!user || !formData.name) return;

        try {
            if (editingPatient) {
                // Update existing patient
                await updateDoc(doc(db, "patients", user.uid, "patientList", editingPatient.id), {
                    ...formData,
                    updatedAt: Timestamp.now()
                });
            } else {
                // Create new patient
                await addDoc(collection(db, "patients", user.uid, "patientList"), {
                    ...formData,
                    createdAt: Timestamp.now()
                });
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving patient:", error);
            alert("Failed to save patient.");
        }
    };

    const handleDelete = async (patientId: string) => {
        if (!user || !confirm("Are you sure you want to delete this patient?")) return;

        try {
            await deleteDoc(doc(db, "patients", user.uid, "patientList", patientId));
        } catch (error) {
            console.error("Error deleting patient:", error);
            alert("Failed to delete patient.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        Patient Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your patient database and records.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_-5px_var(--primary)] flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Patient
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search patients by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
            </div>

            {/* Patients Grid */}
            {filteredPatients.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{searchQuery ? "No patients found matching your search." : "No patients yet. Add your first patient to get started."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient, i) => (
                        <motion.div
                            key={patient.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-6 rounded-2xl hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{patient.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {patient.age} yrs • {patient.gender}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(patient)}
                                        className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} className="text-muted-foreground" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(patient.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </div>
                            </div>

                            {patient.email && (
                                <p className="text-sm text-muted-foreground mb-1">{patient.email}</p>
                            )}
                            {patient.phone && (
                                <p className="text-sm text-muted-foreground mb-2">{patient.phone}</p>
                            )}
                            {patient.notes && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{patient.notes}</p>
                            )}

                            <Link
                                href={`/dashboard?patient=${patient.id}`}
                                className="mt-4 inline-block text-sm text-primary hover:text-primary/80 font-medium"
                            >
                                View Scans →
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card p-6 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">
                                    {editingPatient ? "Edit Patient" : "Add Patient"}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                        placeholder="Patient name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Age</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                            placeholder="Age"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                                        placeholder="Phone number"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1 block">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none transition-colors resize-none"
                                        rows={3}
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-3 bg-card border border-border rounded-xl font-semibold hover:bg-accent/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!formData.name}
                                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    {editingPatient ? "Update" : "Create"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
