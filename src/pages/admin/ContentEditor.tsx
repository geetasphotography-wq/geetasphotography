
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Plus, Pencil, Trash2, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
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

interface Package {
    id: string;
    name: string;
    price: string;
    duration: string;
    photos: string;
    features: string[];
    popular: boolean;
    order: number;
}

interface SiteSettings {
    businessName: string;
    tagline: string;
    about: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    email: string;
    address: string;
}

interface Testimonial {
    id: string;
    name: string;
    text: string;
    babyAge: string;
}



export default function ContentEditor() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [packageToDelete, setPackageToDelete] = useState<string | null>(null);



    // Settings State
    const [settings, setSettings] = useState<SiteSettings>({
        businessName: "Geeta's",
        tagline: "Capturing First Smiles & Forever Memories",
        about: "We specialize in wedding and portrait photography...",
        phone: "+91 98765 43210",
        whatsapp: "+91 98765 43210",
        instagram: "serenemoments",
        email: "tonedigitals.mahesh@gmail.com",
        address: "123 Photography Lane, Creative City"
    });
    const [settingsLoading, setSettingsLoading] = useState(true);

    // Package Form State
    const [formData, setFormData] = useState<Omit<Package, "id">>({
        name: "",
        price: "",
        duration: "",
        photos: "",
        features: [""],
        popular: false,
        order: 0,
    });

    useEffect(() => {
        fetchPackages();
        fetchSettings();
        fetchTestimonials();
    }, []);

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "settings", "general");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data() as SiteSettings);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            await setDoc(doc(db, "settings", "general"), settings);
            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        }
    };

    const fetchPackages = async () => {
        try {
            const q = query(collection(db, "packages"), orderBy("order"));
            const querySnapshot = await getDocs(q);
            const pkgs: Package[] = [];
            querySnapshot.forEach((doc) => {
                pkgs.push({ id: doc.id, ...doc.data() } as Package);
            });
            setPackages(pkgs);
        } catch (error) {
            console.error("Error fetching packages:", error);
            if (packages.length > 0) toast.error("Failed to load packages");
        } finally {
            setLoading(false);
        }
    };

    const handleSavePackage = async () => {
        try {
            const cleanData = {
                ...formData,
                features: formData.features.filter(f => f.trim() !== "")
            };

            if (editingPackage) {
                await updateDoc(doc(db, "packages", editingPackage.id), cleanData);
                toast.success("Package updated successfully");
            } else {
                await addDoc(collection(db, "packages"), cleanData);
                toast.success("Package created successfully");
            }
            setIsDialogOpen(false);
            fetchPackages();
        } catch (error) {
            console.error("Error saving package:", error);
            toast.error("Failed to save package");
        }
    };

    const handleDeleteClick = (id: string) => {
        setPackageToDelete(id);
    };

    const confirmDelete = async () => {
        if (!packageToDelete) return;

        try {
            await deleteDoc(doc(db, "packages", packageToDelete));
            toast.success("Package deleted");
            fetchPackages();
        } catch (error) {
            toast.error("Failed to delete package");
        } finally {
            setPackageToDelete(null);
        }
    };

    // ... (Package form helpers: openEdit, openNew, updateFeature, addFeature)
    const openEdit = (pkg: Package) => { setEditingPackage(pkg); const { id, ...rest } = pkg; setFormData(rest); setIsDialogOpen(true); };
    const openNew = () => { setEditingPackage(null); setFormData({ name: "", price: "", duration: "", photos: "", features: [""], popular: false, order: packages.length }); setIsDialogOpen(true); };
    const updateFeature = (index: number, value: string) => { const newFeatures = [...formData.features]; newFeatures[index] = value; setFormData({ ...formData, features: newFeatures }); };
    const addFeature = () => { setFormData({ ...formData, features: [...formData.features, ""] }); };


    // Testimonial State
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
    const [testimonialFormData, setTestimonialFormData] = useState<Omit<Testimonial, "id">>({ name: "", text: "", babyAge: "" });
    const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);

    const fetchTestimonials = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "testimonials"));
            const tests: Testimonial[] = [];
            querySnapshot.forEach((doc) => {
                tests.push({ id: doc.id, ...doc.data() } as Testimonial);
            });
            setTestimonials(tests);
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            toast.error("Failed to load testimonials");
        }
    };



    const handleSaveTestimonial = async () => {
        try {
            if (editingTestimonial) {
                await updateDoc(doc(db, "testimonials", editingTestimonial.id), testimonialFormData);
                toast.success("Testimonial updated");
            } else {
                await addDoc(collection(db, "testimonials"), testimonialFormData);
                toast.success("Testimonial added");
            }
            setIsTestimonialDialogOpen(false);
            fetchTestimonials();
        } catch (error) {
            console.error("Error saving testimonial:", error);
            toast.error("Failed to save testimonial");
        }
    };

    const confirmDeleteTestimonial = async () => {
        if (!testimonialToDelete) return;
        try {
            await deleteDoc(doc(db, "testimonials", testimonialToDelete));
            toast.success("Testimonial deleted");
            fetchTestimonials();
        } catch (error) {
            toast.error("Failed to delete testimonial");
        } finally {
            setTestimonialToDelete(null);
        }
    };

    const openNewTestimonial = () => {
        setEditingTestimonial(null);
        setTestimonialFormData({ name: "", text: "", babyAge: "" });
        setIsTestimonialDialogOpen(true);
    };

    const openEditTestimonial = (test: Testimonial) => {
        setEditingTestimonial(test);
        const { id, ...data } = test;
        setTestimonialFormData(data);
        setIsTestimonialDialogOpen(true);
    };


    return (
        <div className="space-y-8 max-w-4xl mx-auto lg:mx-0 pb-20">
            {/* ... (Header and Settings Section) ... */}

            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Editor</h1>
                    <p className="text-muted-foreground">Manage website content and packages.</p>
                </div>
                <Button onClick={saveSettings} disabled={settingsLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                </Button>
            </div>

            {/* Settings Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Business Information</CardTitle>
                        <CardDescription>General details displayed across the site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                                id="businessName"
                                value={settings.businessName}
                                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tagline">Tagline</Label>
                            <Input
                                id="tagline"
                                value={settings.tagline}
                                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="about">About Description</Label>
                            <Textarea
                                id="about"
                                className="min-h-[100px]"
                                value={settings.about}
                                onChange={(e) => setSettings({ ...settings, about: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={settings.phone}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp Number</Label>
                            <Input
                                id="whatsapp"
                                value={settings.whatsapp}
                                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram Handle (Username)</Label>
                            <Input
                                id="instagram"
                                value={settings.instagram || ""}
                                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                                placeholder="e.g. serenemoments"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                value={settings.email || ""}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>






            {/* Packages Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Packages</CardTitle>
                        <CardDescription>Manage your photography packages.</CardDescription>
                    </div>
                    <Button onClick={openNew} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Package
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {packages.map((pkg) => (
                                <Card key={pkg.id} className="relative group">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-start">
                                            <span>{pkg.name}</span>
                                            {pkg.popular && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                    Popular
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription>₹{pkg.price}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground space-y-2">
                                        <p>{pkg.duration}</p>
                                        <p>{pkg.photos}</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {pkg.features.slice(0, 3).map((f, i) => (
                                                <li key={i}>{f}</li>
                                            ))}
                                            {pkg.features.length > 3 && <li>+{pkg.features.length - 3} more</li>}
                                        </ul>
                                        <div className="flex gap-2 mt-4 pt-4 border-t">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(pkg)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteClick(pkg.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Testimonials Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Testimonials</CardTitle>
                        <CardDescription>Manage user reviews and testimonials.</CardDescription>
                    </div>
                    <Button onClick={openNewTestimonial} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Testimonial
                    </Button>
                </CardHeader>
                <CardContent>
                    {testimonials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No testimonials yet. Add one to get started.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {testimonials.map((test) => (
                                <Card key={test.id} className="relative group">
                                    <CardHeader>
                                        <CardTitle className="text-base">{test.name}</CardTitle>
                                        <CardDescription className="text-xs">{test.babyAge}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground italic">"{test.text}"</p>
                                        <div className="flex gap-2 pt-2 border-t">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditTestimonial(test)}>
                                                <Pencil className="w-3 h-3 mr-2" />
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => setTestimonialToDelete(test.id)}>
                                                <Trash2 className="w-3 h-3 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Package Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPackage ? "Edit Package" : "New Package"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Package Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Essential"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Price (₹)</Label>
                                <Input
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="e.g. 15,000"
                                />
                            </div>
                        </div>
                        {/* ... rest of the form ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duration</Label>
                                <Input
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="e.g. 1.5 hours"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Photos Count</Label>
                                <Input
                                    value={formData.photos}
                                    onChange={(e) => setFormData({ ...formData, photos: e.target.value })}
                                    placeholder="e.g. 15 edited photos"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Features</Label>
                            {formData.features.map((feature, index) => (
                                <Input
                                    key={index}
                                    value={feature}
                                    onChange={(e) => updateFeature(index, e.target.value)}
                                    className="mb-2"
                                    placeholder={`Feature ${index + 1}`}
                                />
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addFeature} className="w-full">
                                <Plus className="w-4 h-4 mr-2" /> Add Feature
                            </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="popular"
                                checked={formData.popular}
                                onCheckedChange={(checked) => setFormData({ ...formData, popular: checked as boolean })}
                            />
                            <Label htmlFor="popular">Mark as Most Popular</Label>
                        </div>

                        <Button onClick={handleSavePackage} className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            Save Package
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Testimonial Dialog */}
            <Dialog open={isTestimonialDialogOpen} onOpenChange={setIsTestimonialDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "New Testimonial"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Parent Names (e.g. Priya & Rahul)</Label>
                            <Input
                                value={testimonialFormData.name}
                                onChange={(e) => setTestimonialFormData({ ...testimonialFormData, name: e.target.value })}
                                placeholder="e.g. Priya & Rahul"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Baby Details / Age (e.g. Baby Arjun, 8 days old)</Label>
                            <Input
                                value={testimonialFormData.babyAge}
                                onChange={(e) => setTestimonialFormData({ ...testimonialFormData, babyAge: e.target.value })}
                                placeholder="e.g. Baby Arjun, 8 days old"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Testimonial Text</Label>
                            <Textarea
                                value={testimonialFormData.text}
                                onChange={(e) => setTestimonialFormData({ ...testimonialFormData, text: e.target.value })}
                                placeholder="Enter the review here..."
                                className="min-h-[100px]"
                            />
                        </div>
                        <Button onClick={handleSaveTestimonial} className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            Save Testimonial
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            <AlertDialog open={!!packageToDelete} onOpenChange={(open) => !open && setPackageToDelete(null)}>
                <AlertDialogContent className="admin-theme">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the package.
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

            <AlertDialog open={!!testimonialToDelete} onOpenChange={(open) => !open && setTestimonialToDelete(null)}>
                <AlertDialogContent className="admin-theme">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Testimonial?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this review from your website.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteTestimonial}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


        </div>
    );
}
