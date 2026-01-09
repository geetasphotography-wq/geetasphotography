import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, setDoc, doc, where, deleteDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Customer } from "@/types/customer";
import { Loader2, Plus, Search, Phone, Mail, Trash2, Edit2, Clock, History, Users, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit / Add / History States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);
    const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form State (Shared for Add/Edit)
    const [formData, setFormData] = useState<Partial<Customer>>({
        name: "", phone: "", email: "", babyDetails: "", notes: ""
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (viewingHistory) {
            fetchCustomerHistory(viewingHistory.id!);
        }
    }, [viewingHistory]);

    const fetchCustomers = async () => {
        try {
            const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data: Customer[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id } as Customer);
            });
            setCustomers(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerHistory = async (customerId: string) => {
        setHistoryLoading(true);
        try {
            // Removed orderBy to avoid missing index requirement
            const q = query(collection(db, "transactions"), where("customerId", "==", customerId));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort in memory (Newest first)
            // @ts-ignore
            data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

            setHistoryTransactions(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSaveCustomer = async () => {
        if (!formData.name || !formData.phone) {
            toast.error("Name and Phone are required");
            return;
        }
        setLoading(true);
        try {
            if (editingCustomer) {
                // Update
                const ref = doc(db, "customers", editingCustomer.id!);
                await setDoc(ref, {
                    ...formData,
                    // Preserve existing fields that aren't in form if needed
                }, { merge: true });
                toast.success("Customer updated");
            } else {
                // Create
                // Check dupes
                const q = query(collection(db, "customers"), where("phone", "==", formData.phone));
                const existing = await getDocs(q);
                if (!existing.empty) {
                    toast.error("Phone number already exists");
                    setLoading(false);
                    return;
                }
                await addDoc(collection(db, "customers"), {
                    ...formData,
                    totalBookings: 0,
                    source: 'offline',
                    createdAt: serverTimestamp()
                });
                toast.success("Customer created");
            }

            setIsAddOpen(false);
            setEditingCustomer(null);
            setFormData({ name: "", phone: "", email: "", babyDetails: "", notes: "" });
            fetchCustomers();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save customer");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this customer?")) return;
        try {
            await deleteDoc(doc(db, "customers", id));
            setCustomers(prev => prev.filter(c => c.id !== id));
            toast.success("Customer deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const openEdit = (c: Customer, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCustomer(c);
        setFormData({
            name: c.name,
            phone: c.phone,
            email: c.email || "",
            babyDetails: c.babyDetails || "",
            notes: c.notes || ""
        });
        setIsAddOpen(true);
    };

    const openAdd = () => {
        setEditingCustomer(null);
        setFormData({ name: "", phone: "", email: "", babyDetails: "", notes: "" });
        setIsAddOpen(true);
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Customer</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 mb-1">Total Customers</p>
                            <h2 className="text-3xl font-bold text-blue-700">{customers.length}</h2>
                        </div>
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50/50 border-purple-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600 mb-1">Online Users</p>
                            <h2 className="text-3xl font-bold text-purple-700">{customers.filter(c => c.source === 'online').length}</h2>
                        </div>
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <Badge className="bg-purple-200 text-purple-700 hover:bg-purple-200 border-0">Online</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50/50 border-orange-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600 mb-1">Offline / Walk-ins</p>
                            <h2 className="text-3xl font-bold text-orange-700">{customers.filter(c => c.source === 'offline' || c.source === 'offline_pos').length}</h2>
                        </div>
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <User className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(c => (
                        <Card
                            key={c.id}
                            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => setViewingHistory(c)}
                        >
                            <CardContent className="p-4">
                                {/* Top Row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                            ${c.source === 'online' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-base leading-tight">{c.name}</h3>
                                            <Badge variant={c.source === 'online' ? "default" : "secondary"} className="mt-1 text-[10px] h-4 px-1.5">
                                                {c.source}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => openEdit(c, e)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>{c.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="truncate">{c.email || "N/A"}</span>
                                    </div>
                                </div>

                                {/* Footer (Delete) */}
                                <div className="flex justify-end pt-2 border-t mt-auto">
                                    <button
                                        className="text-xs flex items-center text-red-500 hover:text-red-700 font-medium transition-colors"
                                        onClick={(e) => handleDelete(c.id!, e)}
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-lg bg-white border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-6 border-b border-border/10 bg-primary/5">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-primary">
                                {editingCustomer ? "Edit Customer" : "Add Customer"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-background border-input focus-visible:ring-primary"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-background border-input focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-background border-input focus-visible:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Baby Details</Label>
                            <Input
                                value={formData.babyDetails}
                                onChange={e => setFormData({ ...formData, babyDetails: e.target.value })}
                                placeholder="e.g. 5, boy"
                                className="bg-background border-input focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
                            <Input
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="bg-background border-input focus-visible:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="p-6 pt-0 bg-gray-50/50 flex justify-end py-4">
                        <Button
                            onClick={handleSaveCustomer}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {loading ? "Saving..." : "Save Customer"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* History Sheet */}
            <Sheet open={!!viewingHistory} onOpenChange={(o) => !o && setViewingHistory(null)}>
                <SheetContent className="sm:max-w-md bg-white border-l shadow-2xl">
                    <SheetHeader className="mb-6 border-b pb-4">
                        <SheetTitle className="text-xl font-bold text-primary">Customer History</SheetTitle>
                        <SheetDescription className="text-xs uppercase tracking-wider text-muted-foreground">
                            Transactions for <span className="font-semibold text-foreground">{viewingHistory?.name}</span>
                        </SheetDescription>
                    </SheetHeader>

                    <div className="h-full">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                                <Loader2 className="animate-spin w-8 h-8 mb-4 opacity-50 text-primary" />
                                <p className="text-sm font-medium">Loading history...</p>
                            </div>
                        ) : historyTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground opacity-60">
                                <History className="w-12 h-12 mb-4 stroke-1 text-primary/50" />
                                <p className="font-medium text-lg">No transaction history found.</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[calc(100vh-180px)] pr-4 -mr-4">
                                <div className="space-y-3 px-1">
                                    {historyTransactions.map((tx: any) => (
                                        <div key={tx.id} className="group bg-card border border-border/50 p-4 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="font-mono text-[10px] text-muted-foreground block mb-1">#{tx.id.slice(0, 8).toUpperCase()}</span>
                                                    <div className="text-lg font-bold text-primary">₹{tx.grandTotal}</div>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] font-medium opacity-80">
                                                    {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "MMM dd, yyyy") : ""}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1.5 pt-3 border-t border-dashed">
                                                {tx.items?.map((i: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-sm text-foreground/80">
                                                        <span>{i.name}</span>
                                                        <span className="text-muted-foreground">x{i.qty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
