import Link from "next/link";
import { ArrowRight, Activity, Zap, Shield, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[128px]" />
      </div>

      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="text-white h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">OrthoVision AI</span>
        </div>
        <Link href="/login" className="px-6 py-2 rounded-full glass hover:bg-white/10 transition-all font-medium text-sm">
          Sign In
        </Link>
      </nav>

      <main className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8 animate-fade-in-up">
          <Zap size={16} />
          <span>Next-Gen Orthodontic Diagnostics</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 max-w-4xl">
          Automated Cephalometric Analysis in Seconds
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Powered by proprietary AI & deep learning geometry. Upload X-rays, detect landmarks instantly, and get functional appliance suitability scores with clinical precision.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link href="/signup" className="flex-1 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group">
            Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="flex-1 px-8 py-4 glass hover:bg-white/5 rounded-xl font-bold text-lg transition-all flex items-center justify-center">
            Live Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
          {[
            { title: "Instant Analysis", desc: "Real-time landmark detection using advanced computer vision.", icon: Zap },
            { title: "Smart Metrics", desc: "Automated ANB, Wits, and suitability calculations.", icon: Activity },
            { title: "HIPAA Ready", desc: "Secure, encrypted cloud storage for patient data.", icon: Shield },
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl text-left hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <item.icon size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="absolute bottom-6 text-sm text-muted-foreground">
        &copy; 2026 OrthoVision AI. All rights reserved.
      </footer>
    </div>
  );
}
