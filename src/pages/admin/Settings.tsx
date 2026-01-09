
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, User, Shield, Bell } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Settings() {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string | null>("Loading...");
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            setEmail(user.email);
        }

        // Initialize theme
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            setIsDark(true);
        }
    }, []);

    const toggleTheme = (checked: boolean) => {
        setIsDark(checked);
        if (checked) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            console.error("Logout Error:", error);
            toast.error("Failed to log out");
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>

            {/* Account Card */}
            <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Shield className="w-5 h-5 text-primary" />
                        Admin Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-lg leading-none">Administrator</h3>
                            <p className="text-sm text-muted-foreground">{email}</p>
                        </div>
                    </div>
                    <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto min-w-[120px]">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                    </Button>
                </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card className="shadow-sm border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Bell className="w-5 h-5 text-primary" />
                        Preferences
                    </CardTitle>
                    <CardDescription>Customize your admin experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive emails about new booking requests.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">Toggle dark theme for the admin panel.</p>
                        </div>
                        <Switch checked={isDark} onCheckedChange={toggleTheme} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
