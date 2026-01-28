"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Point } from "@/lib/geometry";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageViewerProps {
    imageSrc: string;
    landmarks: Record<string, Point>;
    onLandmarkChange: (name: string, newPoint: Point) => void;
}

export default function ImageViewer({ imageSrc, landmarks, onLandmarkChange }: ImageViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 4;
    const ZOOM_STEP = 0.25;

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    };

    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setZoom(prev => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleMouseUpGlobal = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener("mouseup", handleMouseUpGlobal);
            return () => window.removeEventListener("mouseup", handleMouseUpGlobal);
        }
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
                <button
                    onClick={handleZoomIn}
                    disabled={zoom >= MAX_ZOOM}
                    className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                    title="Zoom In (Ctrl+Scroll)"
                >
                    <ZoomIn size={18} className="text-white" />
                </button>
                <button
                    onClick={handleZoomOut}
                    disabled={zoom <= MIN_ZOOM}
                    className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                    title="Zoom Out (Ctrl+Scroll)"
                >
                    <ZoomOut size={18} className="text-white" />
                </button>
                <button
                    onClick={handleReset}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                    title="Reset Zoom"
                >
                    <RotateCcw size={18} className="text-white" />
                </button>
            </div>

            {/* Zoom Indicator */}
            {zoom !== 1 && (
                <div className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs font-semibold">
                    {Math.round(zoom * 100)}%
                </div>
            )}

            {/* Image Container with Transform */}
            <div
                className="absolute inset-0 origin-center transition-transform duration-200"
                style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                }}
            >
                <img
                    src={imageSrc}
                    alt="Lateral Ceph"
                    className="w-full h-full object-contain pointer-events-none"
                />

                {/* Overlay SVG for lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-60">
                    {landmarks["S"] && landmarks["N"] && (
                        <line x1={`${landmarks.S.x}%`} y1={`${landmarks.S.y}%`} x2={`${landmarks.N.x}%`} y2={`${landmarks.N.y}%`} stroke="#2D7FF9" strokeWidth="2.5" />
                    )}
                    {landmarks["N"] && landmarks["A"] && (
                        <line x1={`${landmarks.N.x}%`} y1={`${landmarks.N.y}%`} x2={`${landmarks.A.x}%`} y2={`${landmarks.A.y}%`} stroke="#2D7FF9" strokeWidth="2" strokeDasharray="5,5" />
                    )}
                    {landmarks["N"] && landmarks["B"] && (
                        <line x1={`${landmarks.N.x}%`} y1={`${landmarks.N.y}%`} x2={`${landmarks.B.x}%`} y2={`${landmarks.B.y}%`} stroke="#2D7FF9" strokeWidth="2" strokeDasharray="5,5" />
                    )}
                </svg>

                {Object.entries(landmarks).map(([name, point]) => (
                    <DraggablePoint
                        key={name}
                        name={name}
                        point={point}
                        containerRef={containerRef}
                        zoom={zoom}
                        onChange={(newPoint) => onLandmarkChange(name, newPoint)}
                    />
                ))}
            </div>
        </div>
    );
}

function DraggablePoint({
    name,
    point,
    containerRef,
    zoom,
    onChange
}: {
    name: string,
    point: Point,
    containerRef: React.RefObject<HTMLDivElement | null>,
    zoom: number,
    onChange: (p: Point) => void
}) {

    // Helper to convert drag to percentage
    const handleDrag = (_: any, info: any) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // info.point is client coordinates.
        // We need the center of the drag handle?

        // Let's rely on the drag ending to update state to avoid excessive re-renders/jitters, 
        // OR update on move for real-time lines?
        // Update on drag is better for UX (lines update).

        const x = ((info.point.x - rect.left) / rect.width) * 100;
        const y = ((info.point.y - rect.top) / rect.height) * 100;

        // Clamp
        const clampedX = Math.min(Math.max(x, 0), 100);
        const clampedY = Math.min(Math.max(y, 0), 100);

        onChange({ x: clampedX, y: clampedY });
    };

    // Map landmark names to display names
    const displayNames: Record<string, string> = {
        S: "Sella",
        N: "Nasion",
        A: "Point A",
        B: "Point B"
    };
    const displayName = displayNames[name] || name;

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            onDrag={handleDrag}
            // Position using style left/top as percentage
            style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                position: 'absolute',
                x: '-50%', // Center the dot
                y: '-50%'
            }}
            whileHover={{ scale: 1.3 }}
            className="cursor-grab active:cursor-grabbing z-20 group"
        >
            {/* Red circular dot - larger and more visible */}
            <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
            </div>

            {/* Yellow label - always visible, positioned to the right */}
            <div 
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap pointer-events-none shadow-md"
                style={{ textShadow: 'none' }}
            >
                {displayName}
            </div>
        </motion.div>
    );
}
