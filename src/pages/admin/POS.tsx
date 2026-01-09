import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where, serverTimestamp, setDoc, doc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Customer } from "@/types/customer";
import { Loader2, Plus, Search, Trash2, Save, Printer, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Types
interface BillItem {
    id: string;
    name: string;
    description?: string;
    qty: number;
    rate: number;
    amount: number;
}

interface Product {
    name: string;
    rate: number;
}



export default function POS() {
    // --- State ---
    const [loading, setLoading] = useState(false);

    // Customer
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);

    // Bill
    const [items, setItems] = useState<BillItem[]>([]);
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [newItemName, setNewItemName] = useState("");
    const [newItemRate, setNewItemRate] = useState<number>(0);
    const [newItemQty, setNewItemQty] = useState<number>(1);

    const [products, setProducts] = useState<Product[]>([]);

    // --- Effects ---
    useEffect(() => {
        fetchAllCustomers();
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const allProducts: Product[] = [];

            // 1. Fetch Main Packages
            const pkgQ = query(collection(db, "content", "packages", "items"));
            const pkgSnap = await getDocs(pkgQ);
            pkgSnap.forEach(doc => {
                const d = doc.data();
                allProducts.push({ name: d.name, rate: parseFloat(d.price) || 0 });
            });

            // 2. Fetch POS-only items
            const posQ = query(collection(db, "pos_items"));
            const posSnap = await getDocs(posQ);
            posSnap.forEach(doc => {
                const d = doc.data();
                // Avoid duplicates if name exists
                if (!allProducts.find(p => p.name === d.name)) {
                    allProducts.push({ name: d.name, rate: d.rate || 0 });
                }
            });

            setProducts(allProducts);
        } catch (error) {
            console.error("Failed to load products", error);
        }
    };

    // Filter customers for autocomplete
    const filteredCustomers = customers.filter(c =>
        (c.name?.toLowerCase().includes(customerName.toLowerCase()) ||
            c.phone?.includes(customerName)) &&
        customerName.length > 0
    );

    // --- Actions ---

    // ... (Customer functions same) ...
    const fetchAllCustomers = async () => {
        try {
            const snap = await getDocs(collection(db, "customers"));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Customer);
            setCustomers(list);
        } catch (e) {
            console.error("Failed to load customers", e);
        }
    };

    const handleSelectCustomer = (c: Customer) => {
        setSelectedCustomer(c);
        setCustomerName(c.name);
        setCustomerPhone(c.phone);
        setSuggestionsOpen(false);
    };

    const handleCustomerNameChange = (val: string) => {
        setCustomerName(val);
        setSelectedCustomer(null); // Reset selection if typing new
        setSuggestionsOpen(true);
        if (val === "") setSuggestionsOpen(false);
    };

    // Item Management
    const addItem = async () => {
        if (!newItemName || newItemRate <= 0) {
            toast.error("Please enter item name and valid rate");
            return;
        }

        const item: BillItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: newItemName,
            qty: newItemQty,
            rate: newItemRate,
            amount: newItemQty * newItemRate
        };

        setItems([...items, item]);

        // Auto-save new item to "pos_items" if not exists
        const exists = products.find(p => p.name.toLowerCase() === newItemName.toLowerCase());
        if (!exists) {
            try {
                await addDoc(collection(db, "pos_items"), {
                    name: newItemName,
                    rate: newItemRate,
                    createdAt: serverTimestamp()
                });
                // Add to local state to reflect immediately
                setProducts([...products, { name: newItemName, rate: newItemRate }]);
                toast.success("New item saved to catalog!");
            } catch (e) {
                console.error("Failed to save new item", e);
            }
        }

        // Reset Inputs
        setNewItemName("");
        setNewItemRate(0);
        setNewItemQty(1);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const clearAll = () => {
        if (!confirm("Are you sure you want to clear the bill?")) return;
        setItems([]);
        setCustomerName("");
        setCustomerPhone("");
        setSelectedCustomer(null);
        setDiscountPercent(0);
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const grandTotal = subtotal - discountAmount;

    // Save / Complete
    const handleCompleteBill = async () => {
        if (items.length === 0) {
            toast.error("Bill is empty!");
            return;
        }
        if (!customerName || !customerPhone) {
            toast.error("Customer details required!");
            return;
        }

        setLoading(true);
        try {
            let customerId = selectedCustomer?.id;

            // 1. Create/Update Customer if needed
            if (!selectedCustomer) {
                // Check if exists by phone first (Double check)
                const existing = customers.find(c => c.phone === customerPhone);
                if (existing) {
                    customerId = existing.id;
                    // Update name if changed? Let's keep existing to be safe.
                } else {
                    // New Customer
                    const newRef = doc(collection(db, "customers"));
                    customerId = newRef.id;
                    await setDoc(newRef, {
                        id: customerId,
                        name: customerName,
                        phone: customerPhone,
                        email: "",
                        totalBookings: 1, // First visit
                        source: 'offline_pos',
                        createdAt: serverTimestamp()
                    });
                }
            } else {
                // Existing Customer - Update metrics
                const custRef = doc(db, "customers", customerId!);
                // In a real app we'd increment totalSpend here too
                await setDoc(custRef, {
                    totalBookings: (selectedCustomer.totalBookings || 0) + 1
                }, { merge: true });
            }

            // 2. Save Transaction
            await addDoc(collection(db, "transactions"), {
                customerId,
                customerName,
                customerPhone,
                items,
                subtotal,
                discountPercent,
                discountAmount,
                grandTotal,
                createdAt: serverTimestamp(),
                status: "paid" // Assuming POS is immediate payment
            });

            toast.success("Bill Completed & Saved!");

            // 3. Reset
            setItems([]);
            setCustomerName("");
            setCustomerPhone("");
            setSelectedCustomer(null);
            setDiscountPercent(0);

            // Refresh customer list silently
            fetchAllCustomers();

        } catch (error) {
            console.error(error);
            toast.error("Failed to save transaction");
        } finally {
            setLoading(false);
        }
    };

    const selectProduct = (p: Product) => {
        setNewItemName(p.name);
        setNewItemRate(p.rate);
    };

    // Autocomplete State
    const [openProductSearch, setOpenProductSearch] = useState(false);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
                    <p className="text-muted-foreground">{new Date().toDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { fetchAllCustomers(); fetchProducts(); }} title="Refresh Data">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Customer Section */}
            <Card className="border-t-4 border-t-primary">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        Customer Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="relative">
                            <Label>Customer Name <span className="text-red-500">*</span></Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search or enter name..."
                                    className="pl-9"
                                    value={customerName}
                                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                                // Make sure suggestions close on blur with delay for click
                                />
                            </div>
                            {/* Autocomplete Dropdown */}
                            {suggestionsOpen && filteredCustomers.length > 0 && (
                                <div className="absolute z-10 w-full bg-popover border text-popover-foreground shadow-md rounded-md mt-1 max-h-[200px] overflow-auto">
                                    {filteredCustomers.map(c => (
                                        <div
                                            key={c.id}
                                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm flex justify-between"
                                            onClick={() => handleSelectCustomer(c)}
                                        >
                                            <span className="font-medium">{c.name}</span>
                                            <span className="text-muted-foreground">{c.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Mobile Number <span className="text-red-500">*</span></Label>
                            <Input
                                className="mt-1"
                                placeholder="10-digit mobile number"
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                // If they manually change phone, detach selection
                                onFocus={() => setSelectedCustomer(null)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Entry Section */}
            <Card className="border-t-4 border-t-blue-500">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="h-6 w-1 bg-blue-500 rounded-full" />
                        Add Products / Services
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-secondary/20 p-4 rounded-lg">
                        <div className="flex-1 w-full flex flex-col gap-2">
                            <Label>Item Name (Type to Search/Add)</Label>

                            <div className="relative z-50 w-full">
                                <Command className="rounded-none border-none overflow-visible bg-transparent">
                                    <CommandInput
                                        placeholder="Search item..."
                                        value={newItemName}
                                        onValueChange={(val) => {
                                            setNewItemName(val);
                                            setOpenProductSearch(true);
                                        }}
                                        className="h-12 text-base border-2 border-blue-500 rounded-md focus:ring-0 shadow-sm bg-background hover:bg-white px-3"
                                    />
                                    {openProductSearch && newItemName.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-white shadow-xl rounded-md border text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 z-50">
                                            <CommandList className="max-h-[300px] overflow-y-auto p-1">
                                                <CommandEmpty className="py-3 px-4 text-sm text-muted-foreground bg-gray-50 flex items-center gap-2 rounded-sm cursor-pointer hover:bg-gray-100" onClick={addItem}>
                                                    <Plus className="w-4 h-4" />
                                                    <span>Press <b>Enter</b> to add "{newItemName}" as new</span>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {products.map((product) => (
                                                        <CommandItem
                                                            key={product.name}
                                                            value={product.name}
                                                            onSelect={(currentValue) => {
                                                                setNewItemName(currentValue);
                                                                setNewItemRate(product.rate);
                                                                setOpenProductSearch(false);
                                                            }}
                                                            className="py-3 px-4 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 border-b last:border-0 rounded-sm"
                                                        >
                                                            <div className="flex justify-between items-center w-full">
                                                                <span className="font-semibold text-gray-800 text-base">{product.name}</span>
                                                                <span className="font-bold text-blue-600 text-base">₹{product.rate}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </div>
                                    )}
                                </Command>
                            </div>
                        </div>
                        <div className="w-full md:w-32">
                            <Label>Rate (₹)</Label>
                            <Input
                                type="number"
                                value={newItemRate}
                                onChange={e => setNewItemRate(parseFloat(e.target.value) || 0)}
                                className="mt-1 bg-background h-12"
                            />
                        </div>
                        <div className="w-full md:w-24">
                            <Label>Qty</Label>
                            <Input
                                type="number"
                                value={newItemQty}
                                onChange={e => setNewItemQty(parseFloat(e.target.value) || 1)}
                                className="mt-1 bg-background h-12"
                            />
                        </div>
                        <Button onClick={addItem} className="w-full md:w-auto h-12 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                            <Plus className="w-4 h-4 mr-2" /> Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bill Table */}
            <Card className="border-t-4 border-t-green-600 min-h-[300px] flex flex-col">
                <CardHeader className="pb-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="h-6 w-1 bg-green-600 rounded-full" />
                        Bill Items
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <div className="rounded-md border mt-4 flex-1">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                            No items added yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right">{item.qty}</TableCell>
                                            <TableCell className="text-right">₹{item.rate}</TableCell>
                                            <TableCell className="text-right font-bold">₹{item.amount}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer Totals */}
                    <div className="mt-6 border-t pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={clearAll}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Clear All
                        </Button>

                        <div className="w-full md:w-80 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Discount (%):</span>
                                <Input
                                    type="number"
                                    className="h-8 w-20 text-right"
                                    value={discountPercent}
                                    onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Discount Amount:</span>
                                <span className="text-red-500">- ₹{discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="text-lg font-bold">Grand Total:</span>
                                <span className="text-2xl font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                            </div>

                            <Button className="w-full h-12 text-lg mt-4" onClick={handleCompleteBill} disabled={loading || items.length === 0}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                Complete Bill
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
