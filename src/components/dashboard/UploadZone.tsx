/* eslint-disable */
"use client";

import { useState, useCallback } from "react";
// import { useDropzone } from "react-dropzone"; // Removed unused import
// I will implement manual logic to avoid extra deps if possible, or assume generic install. 
// Actually, standard HTML5 drag-and-drop is fine.
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, X, CheckCircle } from "lucide-react";
import clsx from "clsx";

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            onFileSelect(droppedFile);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            onFileSelect(selectedFile);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
                "relative group cursor-pointer w-full h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 overflow-hidden",
                isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-card/50 glass text-muted-foreground",
                file ? "border-green-500/50 bg-green-500/5" : ""
            )}
        >
            <input
                type="file"
                accept="image/*,.dicom"
                onChange={handleFileInput}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />

            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            Upload Lateral Ceph
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Drag & drop your X-ray here, or click to browse. Supports JPG, PNG, DICOM.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="selected"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">{file.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button onClick={clearFile} className="mt-4 px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-xs font-semibold hover:bg-red-500/20 z-20 relative">
                            Remove
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        </div>
    );
}
