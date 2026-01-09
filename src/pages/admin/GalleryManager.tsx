
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Eye, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

interface GalleryImage {
    id: string;
    url: string;
    tag: string;
    publicId?: string;
}

const CATEGORIES = [
    { value: "newborn", label: "Newborn" },
    { value: "kids", label: "Kids" },
    { value: "baby", label: "Baby" },
    { value: "maternity", label: "Maternity" },
    { value: "family", label: "Family" },
];

export default function GalleryManager() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Upload Form State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("newborn");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Only previews the first one for now
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState("");

    // Bulk Delete State
    const [selectedDeleteIds, setSelectedDeleteIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const q = query(collection(db, "images"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const imgs: GalleryImage[] = [];
            querySnapshot.forEach((doc) => {
                imgs.push({ id: doc.id, ...doc.data() } as GalleryImage);
            });
            setImages(imgs);
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setSelectedFiles(files);
            // Preview the first file just to show something
            setPreviewUrl(URL.createObjectURL(files[0]));
        }
    };

    const clearSelection = () => {
        setSelectedFiles([]);
        setPreviewUrl(null);
        setUploadProgress("");
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);

        try {
            let successCount = 0;
            const total = selectedFiles.length;

            for (let i = 0; i < total; i++) {
                const file = selectedFiles[i];
                setUploadProgress(`Uploading ${i + 1} of ${total}...`);

                try {
                    const uploadResult = await uploadToCloudinary(file);
                    await addDoc(collection(db, "images"), {
                        url: uploadResult.url,
                        publicId: uploadResult.publicId,
                        tag: selectedCategory,
                        createdAt: serverTimestamp()
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to upload file ${file.name}:`, err);
                    toast.error(`Failed to upload ${file.name}`);
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully uploaded ${successCount} images!`);
                setIsDialogOpen(false);
                clearSelection();
                fetchImages();
            } else {
                toast.error("No images were uploaded successfully.");
            }

        } catch (error) {
            console.error("Batch upload error:", error);
            toast.error("Batch upload encountered errors.");
        } finally {
            setUploading(false);
            setUploadProgress("");
        }
    };

    const handleDeleteClick = (id: string) => {
        setImageToDelete(id);
    };

    const confirmDelete = async () => {
        if (!imageToDelete) return;

        try {
            await deleteDoc(doc(db, "images", imageToDelete));

            // Attempt to delete from Cloudinary if publicId exists
            const image = images.find(img => img.id === imageToDelete);
            if (image?.publicId) {
                try {
                    console.log("Attempting to delete publicId:", image.publicId);
                    await deleteFromCloudinary(image.publicId);
                } catch (err: any) {
                    console.error("Failed to delete from Cloudinary:", err);
                    toast.error(`Local delete OK, but Cloud delete failed: ${err.message}`);
                }
            }

            setImages(images.filter(img => img.id !== imageToDelete));
            toast.success("Image deleted");
        } catch (error) {
            toast.error("Failed to delete image");
        } finally {
            setImageToDelete(null);
        }
    };

    // Bulk Delete Logic
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedDeleteIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedDeleteIds(newSet);
    };

    const handleBulkDelete = async () => {
        if (selectedDeleteIds.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedDeleteIds.size} images? This cannot be undone.`)) {
            return;
        }

        setIsBulkDeleting(true);
        const idsToDelete = Array.from(selectedDeleteIds);
        let successCount = 0;

        try {
            // We can optimize this with Promise.all but sequential is safer for now to track errors
            for (const id of idsToDelete) {
                try {
                    await deleteDoc(doc(db, "images", id));
                    const image = images.find(img => img.id === id);
                    if (image?.publicId) {
                        try {
                            await deleteFromCloudinary(image.publicId);
                        } catch (err) {
                            console.error(`Failed to delete cloud image ${id}:`, err);
                        }
                    }
                    successCount++;
                } catch (error) {
                    console.error(`Failed to delete image ${id}:`, error);
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully deleted ${successCount} images.`);
                // Refresh local state
                setImages(prev => prev.filter(img => !selectedDeleteIds.has(img.id)));
                setSelectedDeleteIds(new Set());
            } else {
                toast.error("Failed to delete images.");
            }

        } catch (error) {
            console.error("Bulk delete error:", error);
            toast.error("An error occurred during bulk deletion.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // ... (Package form helpers: openEdit, openNew, updateFeature, addFeature)

    return (
        <div className="relative min-h-[80vh] pb-20">
            {/* Header */}
            <div className="border-b pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Gallery</h1>
                    <p className="text-sm text-muted-foreground">Manage and organize your portfolio.</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedDeleteIds.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="animate-in fade-in slide-in-from-right-4"
                        >
                            {isBulkDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Selected ({selectedDeleteIds.size})
                                </>
                            )}
                        </Button>
                    )}

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open && !uploading) clearSelection();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Image</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Upload New Image(s)</DialogTitle>
                                <DialogDescription>
                                    Choose one or more photos to add to your portfolio.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5 py-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Image Files</Label>
                                    <div className="border-2 border-dashed border-input hover:border-primary/50 transition-colors rounded-xl p-4 text-center cursor-pointer relative bg-secondary/20">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={uploading}
                                        />
                                        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                            {selectedFiles.length > 0 ? (
                                                <div className="relative">
                                                    {previewUrl && (
                                                        <img src={previewUrl} className="max-h-32 rounded-lg object-contain shadow-sm opacity-50" alt="Preview First" />
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="bg-background/80 backdrop-blur text-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-sm border">
                                                            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center shadow-sm">
                                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Tap to select photos (Multiple allowed)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {selectedFiles.length > 0 && !uploading && (
                                        <div className="flex justify-end">
                                            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8 text-xs text-muted-foreground hover:text-destructive">
                                                <X className="w-3 h-3 mr-1" /> Clear selection
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={uploading}>
                                        <SelectTrigger className="h-11 rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">This category will apply to all selected images.</p>
                                </div>

                                <Button
                                    onClick={handleUpload}
                                    className="w-full h-12 rounded-xl text-base font-medium mt-2"
                                    disabled={selectedFiles.length === 0 || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            {uploadProgress || "Uploading..."}
                                        </>
                                    ) : (
                                        `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} Image${selectedFiles.length !== 1 ? 's' : ''}`
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Content State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground text-sm">Loading gallery...</p>
                </div>
            ) : images.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center text-center py-20 px-4 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-secondary/50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <ImageIcon className="w-10 h-10 text-muted-foreground/60" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No images yet</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-8 text-sm leading-relaxed">
                        Upload your portfolio pieces to get started. They will appear here and on your main website.
                    </p>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {images.map((img) => (
                        <Card key={img.id} className={`overflow-hidden group border-0 shadow-sm rounded-xl bg-card relative ${selectedDeleteIds.has(img.id) ? 'ring-2 ring-primary' : ''}`}>
                            <div className="absolute top-2 left-2 z-20">
                                <Checkbox
                                    checked={selectedDeleteIds.has(img.id)}
                                    onCheckedChange={() => toggleSelection(img.id)}
                                    className="w-6 h-6 bg-white/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white/50 backdrop-blur-sm"
                                />
                            </div>
                            <div className="relative aspect-square">
                                <img
                                    src={img.url}
                                    alt="Gallery"
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full shadow-lg" asChild>
                                        <a href={img.url} target="_blank" rel="noopener noreferrer">
                                            <Eye className="w-4 h-4" />
                                        </a>
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full shadow-lg" onClick={() => handleDeleteClick(img.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize">
                                    {img.tag}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Floating Action Button (FAB) */}


            <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
                <AlertDialogContent className="admin-theme">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the image from your gallery.
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
