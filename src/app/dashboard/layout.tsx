import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto max-h-screen p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900/50 via-background to-background">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
