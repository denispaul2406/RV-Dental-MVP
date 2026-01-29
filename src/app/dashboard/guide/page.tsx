"use client";

import { BookOpen } from "lucide-react";

const MALOCCLUSIONS = [
    {
        class: "Class I (Neutroclusion)",
        short: "Normal molar relationship; crowding or spacing.",
        treatment: "Fixed appliances for alignment; extractions if crowding. No skeletal correction needed.",
    },
    {
        class: "Class II (Distocclusion)",
        short: "Lower jaw behind upper jaw; increased overjet; “overbite” appearance.",
        treatment: "Growth phase: functional appliances (e.g. Twin Block, Herbst). Later: fixed appliances; sometimes extractions or surgery if severe.",
    },
    {
        class: "Class III (Mesiocclusion)",
        short: "Lower jaw ahead of upper; reverse overjet; “underbite”.",
        treatment: "Growth: facemask or chin cup in selected cases. Later: fixed appliances; surgery if skeletal.",
    },
];

export default function GuidePage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Malocclusions &amp; Treatment Guide
                </h1>
                <p className="text-muted-foreground mt-1">
                    Types of malocclusions and what is typically used in each case.
                </p>
            </div>

            <div className="grid gap-6">
                {MALOCCLUSIONS.map((item, i) => (
                    <div
                        key={item.class}
                        className="glass-card p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-colors"
                    >
                        <h2 className="font-heading font-semibold text-xl text-primary mb-2">
                            {item.class}
                        </h2>
                        <p className="text-muted-foreground text-sm mb-4">{item.short}</p>
                        <p className="text-foreground text-sm">
                            <strong>Typical approach:</strong> {item.treatment}
                        </p>
                    </div>
                ))}
            </div>

            <div className="glass-card p-6 rounded-2xl border border-primary/20 bg-primary/5">
                <h3 className="font-heading font-semibold text-lg text-primary mb-2">
                    How this app uses it
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    InsightCeph focuses on <strong className="text-foreground">Class II</strong> cases suitable for functional appliance therapy. Criteria include ANB &gt; 4.5°, Overjet &gt; 5 mm, and age 9–15 years. If your analysis meets these, functional appliances may be considered; otherwise, other mechanics or extraction/surgery may be indicated.
                </p>
            </div>
        </div>
    );
}
