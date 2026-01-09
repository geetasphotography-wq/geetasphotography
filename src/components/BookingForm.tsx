import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { AuthModal } from "@/components/auth/AuthModal";

const shootTypes = [
  "Newborn (0-14 days)",
  "Baby (3-12 months)",
  "Kids Photography",
  "Maternity",
  "Family",
];

/* FIX: Added import for Firebase */
// Imports moved to top of file

// ... existing code ...

const BookingForm = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [formData, setFormData] = useState({
    parentName: "",
    babyAge: "",
    shootType: "",
    preferredDate: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactDetails, setContactDetails] = useState({
    phone: "+91 89752 22100",
    email: "tonedigitals.mahesh@gmail.com",
    address: "19/2A, Pantacha got,\nKaranje Turf Satara,\nSatara, Maharashtra 415001",
    whatsapp: "918975222100",
    instagram: "serenemoments"
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContactDetails(prev => ({
            ...prev,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            address: data.address || prev.address,
            whatsapp: data.whatsapp || prev.whatsapp,
            instagram: data.instagram || prev.instagram,
          }));
        }
      } catch (error) {
        console.error("Error fetching contact settings:", error);
      }
    };
    fetchSettings();
  }, []);

  /* FIX: Added import for Firebase */
  // Imports moved to top of file

  // ... existing code ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "messages"), {
        ...formData,
        customerId: user.uid,
        createdAt: serverTimestamp(),
        read: false,
      });

      toast({
        title: "Booking Request Received",
        description: "We'll get back to you within 24 hours to confirm your session.",
      });

      setFormData({
        parentName: "",
        babyAge: "",
        shootType: "",
        preferredDate: "",
        phone: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again or contact us via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi! I'm interested in booking a photography session."
    );
    // Using your specific number from settings
    const cleanNumber = contactDetails.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
  };

  return (
    /* FIX: Added 'relative' to the section classes to resolve the 
       "non-static position" Framer Motion warning.
    */
    <section id="booking" className="section-padding bg-background relative pb-32 mb-12">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => { }}
      />
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
            Book Your Session
          </h2>
          <p className="text-muted-foreground font-sans text-sm uppercase tracking-[0.2em]">
            Let's create something beautiful together
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-2 uppercase tracking-wider">
                  Parent Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-secondary/50 border-0 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-2 uppercase tracking-wider">
                  Baby's Age / Stage
                </label>
                <input
                  type="text"
                  value={formData.babyAge}
                  onChange={(e) =>
                    setFormData({ ...formData, babyAge: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-secondary/50 border-0 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g., 10 days, 2 years"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-2 uppercase tracking-wider">
                  Shoot Type
                </label>
                <select
                  required
                  value={formData.shootType}
                  onChange={(e) =>
                    setFormData({ ...formData, shootType: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-secondary/50 border-0 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select type</option>
                  {shootTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-2 uppercase tracking-wider">
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredDate: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-secondary/50 border-0 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-2 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-secondary/50 border-0 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="+91 89752 22100"
                />
              </div>
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-secondary/50 border-0 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-sans text-muted-foreground mb-2 uppercase tracking-wider">
                Additional Notes
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 bg-secondary/50 border-0 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Tell us about any special requests..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-foreground text-background text-sm uppercase tracking-[0.2em] font-sans hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Request Booking"}
            </button>
          </motion.form>

          {/* Contact Info & Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-foreground mb-6">
                Contact Details
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-foreground" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-muted-foreground uppercase tracking-wider">
                      Studio Location
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactDetails.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="not-italic font-sans text-foreground leading-relaxed whitespace-pre-line hover:text-primary transition-colors block"
                    >
                      {contactDetails.address}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <Phone size={20} className="text-foreground" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-muted-foreground uppercase tracking-wider">
                      Phone
                    </p>
                    <a href={`tel:${contactDetails.phone}`} className="font-sans text-foreground hover:text-primary transition-colors">
                      {contactDetails.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <Mail size={20} className="text-foreground" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-muted-foreground uppercase tracking-wider">
                      Email
                    </p>
                    <a href={`mailto:${contactDetails.email}`} className="font-sans text-foreground hover:text-primary transition-colors">
                      {contactDetails.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <Instagram size={20} className="text-foreground" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-muted-foreground uppercase tracking-wider">
                      Instagram
                    </p>
                    <a
                      href={`https://instagram.com/${contactDetails.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-foreground hover:text-primary transition-colors"
                    >
                      @{contactDetails.instagram}
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-4 w-full p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors rounded-sm group"
                >
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-sans text-sm text-muted-foreground uppercase tracking-wider">WhatsApp Support</p>
                    <p className="font-sans text-foreground group-hover:text-[#25D366] transition-colors">Chat with us now</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;