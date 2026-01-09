
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

type Category = "all" | "newborn" | "kids" | "baby" | "maternity" | "family";

interface GalleryImage {
  id: string;
  src: string;
  category: Category;
  alt: string;
}

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "newborn", label: "Newborn" },
  { id: "kids", label: "Kids" },
  { id: "baby", label: "Baby" },
  { id: "maternity", label: "Maternity" },
  { id: "family", label: "Family" },
];

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const q = query(collection(db, "images"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const imgs: GalleryImage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          imgs.push({
            id: doc.id,
            src: data.url,
            category: data.tag as Category,
            alt: `Portfolio ${data.tag}`
          });
        });
        setGalleryImages(imgs);
      } catch (error) {
        console.error("Error fetching gallery images:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  /* State for pagination/load more */
  const [visibleCount, setVisibleCount] = useState(9); // Start with 9 images

  // Reset visible count when category changes to avoid confusion
  useEffect(() => {
    setVisibleCount(9);
  }, [activeCategory]);

  const filteredImages =
    activeCategory === "all"
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory);

  const displayedImages = filteredImages.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 9);
  };

  const handlePrev = () => {
    if (selectedImage !== null) {
      // Logic needs to find the global index if we were using filteredImages directly, 
      // but here we are using the filtered list for navigation which is correct.
      setSelectedImage(
        selectedImage === 0 ? filteredImages.length - 1 : selectedImage - 1
      );
    }
  };

  const handleNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === filteredImages.length - 1 ? 0 : selectedImage + 1
      );
    }
  };

  return (
    <section id="gallery" className="section-padding bg-secondary/30 relative">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-4">
            Our Portfolio
          </h2>
          <p className="text-muted-foreground font-sans text-sm uppercase tracking-[0.2em]">
            A collection of precious moments
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedImage(null);
              }}
              className={`px-6 py-2 text-sm uppercase tracking-[0.15em] font-sans transition-all duration-300 ${activeCategory === cat.id
                ? "bg-foreground text-background"
                : "bg-transparent text-foreground border border-border hover:border-foreground"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Masonry Grid */}
        <div className="min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-full py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Shooting images to show here.
            </div>
          ) : (
            <>
              <motion.div
                layout
                className="relative columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
              >
                <AnimatePresence mode="popLayout">
                  {displayedImages.map((image, index) => (
                    <motion.div
                      key={image.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="break-inside-avoid cursor-pointer overflow-hidden rounded-sm group"
                      onClick={() => setSelectedImage(index)} // Note: index here corresponds to displayedImages index
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load More Button */}
              {visibleCount < filteredImages.length && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-3 bg-white border border-border hover:bg-muted transition-colors uppercase tracking-widest text-xs font-medium"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && filteredImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-background/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={32} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 md:left-8 text-background/80 hover:text-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={40} />
            </button>

            <motion.img
              key={filteredImages[selectedImage].src}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              src={filteredImages[selectedImage].src}
              alt={filteredImages[selectedImage].alt}
              className="max-w-full max-h-[85vh] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 md:right-8 text-background/80 hover:text-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={40} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-background/60 text-sm font-sans tracking-widest">
              {selectedImage + 1} / {filteredImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;