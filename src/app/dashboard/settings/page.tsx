"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { User, Bell, Shield, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage your profile and application preferences.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Profile Information</h2>
                            <p className="text-sm text-muted-foreground">Update your personal details</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full p-3 rounded-xl bg-muted/50 border border-border text-muted-foreground cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <input
                                type="text"
                                placeholder="Dr. Ortho"
                                className="w-full p-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Preferences */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Security & Privacy</h2>
                            <p className="text-sm text-muted-foreground">Manage password and security settings</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Notifications</p>
                                    <p className="text-xs text-muted-foreground">Receive email alerts for completed analyses</p>
                                </div>
                            </div>
                            <input type="checkbox" className="toggle" defaultChecked />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
