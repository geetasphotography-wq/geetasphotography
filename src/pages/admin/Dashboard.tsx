
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Mail, Package, Users, Loader2, Eye } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { fetchGeneralStats } from "@/lib/analytics";

export default function Dashboard() {
    const [stats, setStats] = useState({
        images: 0,
        messages: 0,
        packages: 0,
        unreadMessages: 0,
        totalViews: 0,
        liveVisitors: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        // Real-time listener for active sessions
        const unsubscribe = onSnapshot(collection(db, "active_sessions"), (snapshot) => {
            const now = new Date();
            // Count users seen in the last 2 minutes (allow some buffer)
            const activeCount = snapshot.docs.filter(doc => {
                const data = doc.data();
                if (!data.lastSeen) return false;
                const lastSeenDate = data.lastSeen.toDate();
                const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
                return diffSeconds < 120; // 2 minutes window
            }).length;

            setStats(prev => ({ ...prev, liveVisitors: activeCount }));
        });

        return () => unsubscribe();
    }, []);

    const fetchStats = async () => {
        try {
            // 1. Fetch Images Count
            const imagesSnap = await getDocs(collection(db, "images"));
            const imagesCount = imagesSnap.size;

            // 2. Fetch Messages Count & Unread
            const messagesSnap = await getDocs(collection(db, "messages"));
            const messagesCount = messagesSnap.size;

            // Calculate unread manually
            const unreadCount = messagesSnap.docs.filter(doc => !doc.data().read).length;

            // 3. Fetch Packages Count
            const packagesSnap = await getDocs(collection(db, "packages"));
            const packagesCount = packagesSnap.size;

            // 4. Fetch General Stats (Views)
            const generalStats = await fetchGeneralStats();

            setStats(prev => ({
                ...prev,
                images: imagesCount,
                messages: messagesCount,
                packages: packagesCount,
                unreadMessages: unreadCount,
                totalViews: generalStats.views || 0
            }));
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Live Visitors",
            value: stats.liveVisitors,
            description: "Currently on site",
            icon: Users,
        },
        {
            title: "Total Views",
            value: stats.totalViews,
            description: "All time site visits",
            icon: Eye,
        },
        {
            title: "Gallery Images",
            value: stats.images,
            description: "Total photos in portfolio",
            icon: Image,
        },
        {
            title: "Total Messages",
            value: stats.messages,
            description: `${stats.unreadMessages} unread inquiries`,
            icon: Mail,
        },
    ];

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your photography business.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions / Recent Activity could go here */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Quick Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                            <li>Upload high-quality images to your gallery to attract more clients.</li>
                            <li>Respond to inquiries in the "Messages" tab promptly.</li>
                            <li>Keep your "Packages" updated with your latest pricing and services.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
