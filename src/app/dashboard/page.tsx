"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Plus, Search, Calendar, Activity, Filter, X } from "lucide-react";
import Image from "next/image";

import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";

type Scan = {
    id: string;
    patient?: string;
    timestamp: Timestamp;
    analysis?: {
        suitable: boolean;
        anb: number;
        overjet?: number;
        message: string;
    };
    imageUrl?: string;
    thumbnail?: string;
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSuitable, setFilterSuitable] = useState<boolean | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "patients", user.uid, "scans"),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const scanData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Scan));
            setScans(scanData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Filter and search scans
    const filteredScans = scans.filter(scan => {
        const matchesSearch = !searchQuery || 
            scan.patient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scan.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = filterSuitable === null || 
            (filterSuitable ? scan.analysis?.suitable : !scan.analysis?.suitable);
        
        return matchesSearch && matchesFilter;
    });

    const clearFilters = () => {
        setSearchQuery("");
        setFilterSuitable(null);
        setShowFilters(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        Patient Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of recent cases and functional analysis.
                    </p>
                </div>
                <Link href="/dashboard/new">
                    <button className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_-5px_var(--primary)] hover:shadow-[0_0_25px_-5px_var(--primary)] flex items-center gap-2">
                        <Plus size={20} />
                        New Analysis
                    </button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by patient name or scan ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                            showFilters || filterSuitable !== null
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-card border-border hover:bg-accent/5"
                        }`}
                    >
                        <Filter size={18} />
                        Filters
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-4 rounded-xl space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Suitability Status</span>
                            {(filterSuitable !== null || searchQuery) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    <X size={14} />
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFilterSuitable(filterSuitable === true ? null : true)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filterSuitable === true
                                        ? "bg-green-500/20 text-green-500 border border-green-500/30"
                                        : "bg-card border border-border hover:bg-accent/5"
                                }`}
                            >
                                Suitable Only
                            </button>
                            <button
                                onClick={() => setFilterSuitable(filterSuitable === false ? null : false)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filterSuitable === false
                                        ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                        : "bg-card border border-border hover:bg-accent/5"
                                }`}
                            >
                                Not Suitable
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Results Count */}
                {(searchQuery || filterSuitable !== null) && (
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredScans.length} of {scans.length} scans
                    </div>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredScans.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
                    <p>{searchQuery || filterSuitable !== null ? "No scans match your filters." : "No scans found. Start a new analysis."}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredScans.map((scan, i) => (
                        <motion.div
                            key={scan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group glass-card rounded-2xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                        >
                            <Link href={`/dashboard/analysis?id=${scan.id}`}>
                                <div className="relative h-48 bg-muted overflow-hidden">
                                    {scan.imageUrl ? (
                                        <img
                                            src={scan.imageUrl}
                                            alt={scan.patient || "X-Ray"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-bold text-4xl">X-RAY</div>
                                    )}
                                    <div className="absolute top-3 right-3 px-3 py-1 glass rounded-full text-xs font-semibold backdrop-blur-md">
                                        ANB {scan.analysis?.anb?.toFixed(1) || "?"}°
                                    </div>
                                    {scan.analysis?.overjet !== undefined && (
                                        <div className="absolute top-3 left-3 px-3 py-1 glass rounded-full text-xs font-semibold backdrop-blur-md">
                                            OJ {scan.analysis.overjet.toFixed(1)}mm
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{scan.patient || `Patient #${scan.id.slice(0, 4)}`}</h3>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scan.analysis?.suitable ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                                            }`}>
                                            {scan.analysis?.suitable ? "Suitable" : "Observe"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {scan.timestamp?.toDate().toLocaleDateString() || "Just now"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Activity size={12} />
                                            Functional Tx
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
