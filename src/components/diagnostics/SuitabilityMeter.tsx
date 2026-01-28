"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface SuitabilityMeterProps {
    // Let's assume input is ANB angle, and we map it to a visual meter.
    // Criteria: ANB > 4.5 is suitable. 
    // Visual range: 0 to 10 degrees.
    val: number;
    label: string;
    isSuitable: boolean;
}

export default function SuitabilityMeter({ val, label, isSuitable }: SuitabilityMeterProps) {
    // Map val (e.g., 5.2) to percentage of logic range (e.g. 0-10)
    const maxVal = 10;
    const percentage = Math.min(Math.max((val / maxVal) * 100, 0), 100);

    // Circumference of a circle with r=40 is 2*pi*40 ~ 251
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-6 glass-card rounded-2xl">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-muted/20"
                    />
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={clsx(
                            isSuitable ? "text-green-500" : "text-yellow-500"
                        )}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{val.toFixed(1)}°</span>
                    <span className="text-xs text-muted-foreground">ANB</span>
                </div>
            </div>

            <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold">{label}</h3>
                <p className={clsx("text-sm font-medium", isSuitable ? "text-green-500" : "text-yellow-500")}>
                    {isSuitable ? "Suitable Candidate" : "Observe / Borderline"}
                </p>
            </div>
        </div>
    );
}
