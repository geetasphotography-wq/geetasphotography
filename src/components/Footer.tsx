
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [businessName, setBusinessName] = useState("Geeta's");
  const [tagline, setTagline] = useState("Capturing First Smiles & Forever Memories");
  const [instagramHandle, setInstagramHandle] = useState("serenemoments");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.businessName) setBusinessName(data.businessName);
          if (data.tagline) setTagline(data.tagline);
          if (data.instagram) setInstagramHandle(data.instagram);
        }
      } catch (error) {
        console.error("Error fetching footer settings:", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo */}
          <div className="mb-8">
            <h3 className="font-serif text-3xl md:text-4xl font-light mb-2">
              {businessName}
            </h3>
            <p className="text-xs uppercase tracking-[0.3em] text-background/60 font-sans">
              Newborn Photography
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-background/30 flex items-center justify-center hover:bg-background hover:text-foreground transition-all duration-300"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-background/30 flex items-center justify-center hover:bg-background hover:text-foreground transition-all duration-300"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
          </div>

          {/* Tagline */}
          <p className="font-serif text-lg md:text-xl italic text-background/70 mb-8">
            {tagline}
          </p>

          {/* Copyright */}
          <div className="pt-8 border-t border-background/10">
            <p className="text-sm text-background/50 font-sans">
              {currentYear} {businessName}. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
