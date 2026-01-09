
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Trash2, MailOpen, Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
    id: string;
    parentName: string;
    email: string;
    phone: string;
    shootType: string;
    message: string;
    createdAt: Timestamp;
    read: boolean;
    preferredDate: string;
    babyAge: string;
}

export default function Messages() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const msgs: Message[] = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
        } catch (error) {
            console.error("Error fetching messages:", error);
            // Don't toast error on first load to avoid noise if collection is empty/missing
        } finally {
            setLoading(false);
        }
    };

    const toggleReadStatus = async (msg: Message) => {
        try {
            const newReadStatus = !msg.read;
            await updateDoc(doc(db, "messages", msg.id), { read: newReadStatus });
            setMessages(messages.map(m => m.id === msg.id ? { ...m, read: newReadStatus } : m));
            toast.success(newReadStatus ? "Marked as read" : "Marked as unread");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDeleteClick = (id: string) => {
        setMessageToDelete(id);
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;

        try {
            await deleteDoc(doc(db, "messages", messageToDelete));
            setMessages(messages.filter(m => m.id !== messageToDelete));
            toast.success("Message deleted");
        } catch (error) {
            toast.error("Failed to delete message");
        } finally {
            setMessageToDelete(null);
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.shootType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-muted-foreground">Manage your incoming booking requests.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search messages..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No messages found.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredMessages.map((msg) => (
                        <Card key={msg.id} className={`transition-all duration-200 ${!msg.read ? 'bg-primary/5 border-primary/20 shadow-sm' : 'hover:bg-accent/50'}`}>
                            <CardContent className="p-5 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                                <div className="flex gap-4 items-start">
                                    <div className={`w-3 h-3 mt-1.5 rounded-full flex-shrink-0 ${!msg.read ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-transparent border border-muted-foreground/30'}`} />
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-lg">{msg.parentName}</span>
                                            <span className="text-sm text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {msg.shootType}
                                            </span>
                                            {!msg.read && <Badge className="text-[10px] h-5 bg-primary hover:bg-primary/90">New</Badge>}
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">✉️ {msg.email}</span>
                                            <span className="flex items-center gap-1">📱 {msg.phone}</span>
                                            <span className="flex items-center gap-1">📅 Pref: {msg.preferredDate}</span>
                                            <span className="flex items-center gap-1">👶 {msg.babyAge}</span>
                                        </div>

                                        <p className="text-sm mt-2 text-foreground/80 bg-background/50 p-3 rounded-md border border-border/50">
                                            "{msg.message || "No additional notes."}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between lg:justify-end gap-6 mt-2 lg:mt-0 pl-7 lg:pl-0 min-w-[140px]">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {msg.createdAt?.seconds ? formatDistanceToNow(new Date(msg.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                            onClick={() => toggleReadStatus(msg)}
                                            title={msg.read ? "Mark as unread" : "Mark as read"}
                                        >
                                            <MailOpen className={`w-4 h-4 ${msg.read ? 'opacity-50' : 'fill-current'}`} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteClick(msg.id)}
                                            title="Delete message"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
                <AlertDialogContent className="admin-theme">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this message.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
