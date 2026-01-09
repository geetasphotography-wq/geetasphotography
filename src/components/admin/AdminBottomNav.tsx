
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Image, FileText, Mail, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Home", path: "/admin/dashboard" },
    { icon: Image, label: "Gallery", path: "/admin/gallery" },
    { icon: FileText, label: "Content", path: "/admin/content" },
    { icon: Mail, label: "Inbox", path: "/admin/messages" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export function AdminBottomNav() {
    const location = useLocation();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-30 pb-safe">
            <nav className="flex justify-around items-center h-16">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
