import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Eye, Trash2, Search, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Transaction {
    id: string;
    customerName: string;
    customerPhone: string;
    items: any[];
    grandTotal: number;
    createdAt: Timestamp;
    status: string;
}

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null); // For "Eye" view

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(data);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this transaction record?")) return;
        try {
            await deleteDoc(doc(db, "transactions", id));
            setTransactions(prev => prev.filter(t => t.id !== id));
            toast.success("Transaction Record Deleted");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete record");
        }
    };

    // --- Filtering Logic ---
    const filteredTransactions = transactions.filter(tx => {
        // 1. View Mode (Today vs All)
        if (viewMode === 'today') {
            const txDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date();
            const today = new Date();
            if (txDate.toDateString() !== today.toDateString()) return false;
        } else if (selectedDate) {
            // If date picker is used in 'all' (or we can just respect date picker globally)
            const txDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date();
            const sel = new Date(selectedDate);
            if (txDate.toDateString() !== sel.toDateString()) return false;
        }

        // 2. Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            return (
                tx.customerName.toLowerCase().includes(lower) ||
                tx.customerPhone.includes(lower) ||
                tx.id.toLowerCase().includes(lower)
            );
        }

        return true;
    });

    // --- Stats Logic ---
    const todayTransactions = transactions.filter(tx => {
        const txDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date();
        const today = new Date();
        return txDate.toDateString() === today.toDateString();
    });

    const revenueToday = todayTransactions.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
    // Assuming simple profit calc or just placeholder if user doesn't have cost data yet.
    // User asked for "Revenue (Today)" and "Profit (Today)". 
    // Since we don't have cost, let's just show Revenue for both or hide Profit or put 0.
    // I'll show Revenue and maybe a dummy Profit (e.g. 60% margin) to match the visual if requested, 
    // but better to be accurate. I'll just label one as Total Sales for now.
    // Actually, let's just stick to Revenue.

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>

                {/* Check stats cards in screenshot - "Revenue (Today)" in Green, "Profit (Today)" in Blue */}
                <div className="flex gap-4">
                    <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-lg text-center min-w-[140px]">
                        <p className="text-xs text-green-600 font-medium uppercase">Revenue (Today)</p>
                        <p className="text-xl font-bold text-green-700">₹{revenueToday.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-lg border">
                        {/* Tabs */}
                        <div className="flex bg-muted p-1 rounded-md">
                            <button
                                onClick={() => setViewMode('today')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${viewMode === 'today' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Today's Transactions
                            </button>
                            <button
                                onClick={() => { setViewMode('all'); setSelectedDate(""); }}
                                className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${viewMode === 'all' && !selectedDate ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                All Transactions
                            </button>
                        </div>

                        {/* Search & Date */}
                        <div className="flex flex-1 w-full md:w-auto gap-2">
                            <div className="relative flex-1 md:max-w-xs">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search customer, mobile, ID..."
                                    className="pl-9 bg-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Input
                                    type="date"
                                    className="w-[150px]"
                                    value={selectedDate}
                                    onChange={(e) => { setSelectedDate(e.target.value); setViewMode('all'); }}
                                // If date selected, imply 'all' context filtered by date or 'date' mode
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="mt-4">
                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="font-semibold">Transaction ID</TableHead>
                                    <TableHead className="font-semibold">Date & Time</TableHead>
                                    <TableHead className="font-semibold">Customer</TableHead>
                                    <TableHead className="font-semibold">Items</TableHead>
                                    <TableHead className="font-semibold text-right">Total</TableHead>
                                    <TableHead className="font-semibold text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No transactions match your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <TableRow key={tx.id} className="hover:bg-muted/20">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{tx.id.slice(0, 8).toUpperCase()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span className="font-medium">
                                                        {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "d/M/yyyy") : "N/A"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "h:mm:ss a") : ""}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span className="font-medium text-primary">{tx.customerName}</span>
                                                    <span className="text-xs text-muted-foreground">{tx.customerPhone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal text-xs">
                                                    {tx.items?.length || 0} items
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-base">
                                                ₹{tx.grandTotal?.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => setSelectedTx(tx)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => handleDelete(tx.id, e)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Receipt / Details Modal */}
            <Dialog open={!!selectedTx} onOpenChange={(o) => !o && setSelectedTx(null)}>
                <DialogContent className="max-w-xl bg-white border-none shadow-2xl p-0 overflow-hidden">
                    {selectedTx && (
                        <div>
                            <div className="p-6 border-b bg-primary/5">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-primary">Transaction Details</DialogTitle>
                                    <DialogDescription className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                                        Ref: #{selectedTx.id.toUpperCase()}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Customer Info */}
                                <div className="bg-muted/30 p-6 rounded-lg space-y-4 border border-border/50">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium w-24">Customer:</span>
                                        <span className="font-semibold text-foreground">{selectedTx.customerName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium w-24">Phone:</span>
                                        <span className="text-foreground font-mono">{selectedTx.customerPhone}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium w-24">Date:</span>
                                        <span className="text-foreground">{selectedTx.createdAt?.toDate ? format(selectedTx.createdAt.toDate(), "PP p") : "N/A"}</span>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div>
                                    <div className="grid grid-cols-12 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-2">
                                        <div className="col-span-6">Item</div>
                                        <div className="col-span-3 text-right">Qty</div>
                                        <div className="col-span-3 text-right">Price</div>
                                    </div>
                                    <div className="border-t divide-y">
                                        {selectedTx.items?.map((item: any, i: number) => (
                                            <div key={i} className="grid grid-cols-12 py-3 px-2 text-sm group hover:bg-muted/20 transition-colors">
                                                <div className="col-span-6 font-medium text-foreground">{item.name}</div>
                                                <div className="col-span-3 text-right text-muted-foreground">{item.qty}</div>
                                                <div className="col-span-3 text-right text-foreground font-medium">₹{item.amount}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-primary/5 p-6 rounded-lg flex justify-between items-center border border-primary/10">
                                    <span className="text-lg font-bold text-foreground">Grand Total</span>
                                    <span className="text-2xl font-bold text-primary">₹{selectedTx.grandTotal?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
