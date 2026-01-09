import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Package {
    id?: string;
    name: string;
    price: string;
    duration: string;
    photos: string;
    features: string[];
    popular?: boolean;
    order?: number;
}

const Packages = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const scrollToBooking = () => {
        const element = document.querySelector("#booking");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section id="packages" className="section-padding bg-background">
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
                        Packages
                    </h2>
                    <p className="text-muted-foreground font-sans text-sm uppercase tracking-[0.2em]">
                        Choose the perfect session for your family
                    </p>
                </motion.div>

                {/* Package Cards */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                    {packages.map((pkg, index) => (
                        <motion.div
                            key={pkg.id || pkg.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className={`relative bg-card rounded-sm p-8 transition-all duration-300 ${pkg.popular
                                ? "shadow-medium ring-1 ring-primary/20"
                                : "shadow-soft hover:shadow-medium"
                                }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-foreground text-background text-xs uppercase tracking-[0.15em] px-4 py-1 font-sans">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <h3 className="font-serif text-2xl md:text-3xl font-light text-foreground mb-4">
                                    {pkg.name}
                                </h3>
                                <div className="mb-4">
                                    <span className="font-serif text-4xl md:text-5xl font-light text-foreground">
                                        ₹{pkg.price}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 text-muted-foreground text-sm font-sans">
                                    <span>{pkg.duration}</span>
                                    <span>{pkg.photos}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                {pkg.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Check
                                            size={16}
                                            className="text-primary mt-0.5 flex-shrink-0"
                                        />
                                        <span className="text-sm text-muted-foreground font-sans">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={scrollToBooking}
                                className={`w-full py-3 text-sm uppercase tracking-[0.15em] font-sans transition-all duration-300 ${pkg.popular
                                    ? "bg-foreground text-background hover:bg-foreground/90"
                                    : "border border-foreground text-foreground hover:bg-foreground hover:text-background"
                                    }`}
                            >
                                Book Now
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Packages;
