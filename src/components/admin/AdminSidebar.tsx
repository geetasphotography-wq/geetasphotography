import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Image, FileText, Mail, Settings, LogOut, Sun, Moon, Users, BadgeDollarSign, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Image, label: "Gallery", path: "/admin/gallery" },
    { icon: FileText, label: "Content", path: "/admin/content" },
    { icon: BadgeDollarSign, label: "POS", path: "/admin/pos" },
    { icon: Receipt, label: "Transactions", path: "/admin/transactions" },
    { icon: Mail, label: "Messages", path: "/admin/messages", hasBadge: true },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        // Theme initialization
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark");
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    useEffect(() => {
        const q = query(collection(db, "messages"), where("read", "==", false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="hidden md:flex flex-col w-64 bg-card h-screen border-r border-border fixed left-0 top-0 z-20">
            <div className="p-6">
                <h1 className="text-xl font-semibold tracking-tight">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Manage your website</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                            {item.hasBadge && unreadCount > 0 && (
                                <span className={cn(
                                    "absolute right-3 flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                                    isActive ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                                )}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border mt-auto space-y-2">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}
