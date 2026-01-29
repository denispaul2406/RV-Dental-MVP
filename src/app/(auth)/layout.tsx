import Link from "next/link";
import { ScanLine, BarChart3, Shield } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex bg-background">
            {/* Theme toggle - visible on all auth pages */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle iconOnly={false} />
            </div>
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
                {/* Soft gradient orbs */}
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
                <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px]" />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)
                        `,
                        backgroundSize: "48px 48px",
                    }}
                />
            </div>

            {/* Left branding panel - hidden on small screens */}
            <aside className="hidden md:flex md:w-[45%] lg:w-[50%] relative flex-col justify-between p-10 lg:p-14 border-r border-border/50">
                <Link href="/" className="font-heading font-bold text-2xl tracking-tight text-foreground hover:text-primary transition-colors">
                    InsightCeph
                </Link>
                <div className="space-y-8">
                    <div>
                        <h2 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                            ML-Powered
                            <br />
                            <span className="text-primary">Cephalometric</span>
                            <br />
                            Analysis
                        </h2>
                        <p className="mt-4 text-muted-foreground text-lg max-w-sm">
                            Upload lateral ceph X-rays, get automated landmark detection and analysis in seconds.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        {[
                            { icon: ScanLine, text: "Automated landmark detection" },
                            { icon: BarChart3, text: "Structured analysis reports" },
                            { icon: Shield, text: "Secure, clinic-ready workflow" },
                        ].map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-muted-foreground">
                                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-sm text-muted-foreground/80">
                    © {new Date().getFullYear()} InsightCeph. For clinical use.
                </p>
            </aside>

            {/* Right: form area */}
            <main className="flex-1 flex flex-col items-center justify-center relative p-4 sm:p-6 md:p-8">
                {/* Mobile branding - visible only on small screens */}
                <div className="md:hidden text-center mb-6">
                    <Link href="/" className="font-heading font-bold text-xl tracking-tight text-foreground">
                        InsightCeph
                    </Link>
                    <p className="text-muted-foreground text-sm mt-1">ML-Powered Cephalometric Analysis</p>
                </div>
                {children}
            </main>
        </div>
    );
}
