import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";

export default function AdminLayout() {
    useEffect(() => {
        // Apply admin theme to body to ensure portals (modals/sheets) get the style
        document.body.classList.add("admin-theme");

        return () => {
            // Cleanup when leaving admin section
            document.body.classList.remove("admin-theme");
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 min-h-screen bg-muted/10 pb-20 md:pb-0">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-fade-in">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <AdminBottomNav />
        </div>
    );
}
