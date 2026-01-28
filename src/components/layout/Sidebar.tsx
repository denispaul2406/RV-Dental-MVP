"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusCircle, Settings, LogOut, ChevronLeft, ChevronRight, Activity, Users } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import clsx from "clsx";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: PlusCircle, label: "New Scan", href: "/dashboard/new" },
    { icon: Users, label: "Patients", href: "/dashboard/patients" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <motion.div
            animate={{ width: isCollapsed ? 80 : 250 }}
            className="h-screen bg-card border-r border-border flex flex-col relative z-20"
        >
            <div className="p-6 flex items-center gap-3 border-b border-border/50 h-20">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Activity className="text-primary-foreground h-5 w-5" />
                </div>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-heading font-bold text-lg tracking-tight whitespace-nowrap"
                    >
                        OrthoVision AI
                    </motion.span>
                )}
            </div>

            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-24 bg-card border border-border rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={clsx(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    className={clsx("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                                />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-medium whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                <button
                    onClick={logout}
                    className={clsx(
                        "flex items-center gap-3 p-3 rounded-xl w-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all group",
                        isCollapsed && "justify-center"
                    )}
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>
        </motion.div>
    );
}
