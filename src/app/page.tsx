import Link from "next/link";
import { ArrowRight, Activity, Zap, Shield, ChevronRight } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-x-hidden overflow-y-auto">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[128px]" />
      </div>

      <nav className="absolute top-0 left-0 right-0 w-full px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center gap-3 z-10 max-w-[100vw] box-border">
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Activity className="text-white h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <span className="font-heading font-bold text-base sm:text-xl tracking-tight truncate">InsightCeph</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <ThemeToggle iconOnly={false} responsiveLabel className="shrink-0 w-auto" />
          <Link href="/login" className="px-3 py-2 sm:px-5 sm:py-2.5 min-w-[4.5rem] sm:min-w-[5.5rem] rounded-full glass glass-hover transition-all font-medium text-xs sm:text-sm text-foreground whitespace-nowrap shrink-0 text-center">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center w-full max-w-[100vw] box-border">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full glass border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in-up max-w-full">
          <Zap size={16} className="shrink-0" />
          <span className="truncate max-w-[calc(100vw-8rem)] sm:max-w-none">Next-Gen Orthodontic Diagnostics</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight mb-4 sm:mb-6 text-foreground max-w-4xl px-1">
          Automated Cephalometric Analysis in Seconds
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 sm:mb-10 leading-relaxed px-1">
          Powered by proprietary AI & deep learning geometry. Upload X-rays, detect landmarks instantly, and get functional appliance suitability scores with clinical precision.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md px-1">
          <Link href="/signup" className="flex-1 px-6 py-3 sm:px-8 sm:py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base sm:text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group whitespace-nowrap min-w-0">
            Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform shrink-0" size={18} />
          </Link>
          <Link href="/login" className="flex-1 px-6 py-3 sm:px-8 sm:py-4 glass glass-hover rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center text-foreground whitespace-nowrap min-w-0">
            Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-20 w-full max-w-5xl px-1 pb-20 sm:pb-24">
          {[
            { title: "Instant Analysis", desc: "Real-time landmark detection using advanced computer vision.", icon: Zap },
            { title: "Smart Metrics", desc: "Automated ANB, Wits, and suitability calculations.", icon: Activity },
            { title: "HIPAA Ready", desc: "Secure, encrypted cloud storage for patient data.", icon: Shield },
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl text-left hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <item.icon size={24} />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center text-xs sm:text-sm text-foreground z-10 px-4">
        &copy; 2026 InsightCeph. All rights reserved.
      </footer>
    </div>
  );
}
