import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import studioImage from "@/assets/studio-1.jpg";

const StudioTour = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
    >
      {/* Parallax Background */}
      <motion.div style={{ y }} className="absolute inset-0 -top-20 -bottom-20">
        <img
          src={studioImage}
          alt="Photography studio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/40" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 min-h-screen flex items-center justify-center py-20"
      >
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-background mb-6"
            >
              Our Studio
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-background/80 font-sans text-base md:text-lg leading-relaxed mb-8"
            >
              Step into our warm, inviting studio designed specifically for
              newborn photography. Natural light floods through floor-to-ceiling
              windows, creating the perfect soft glow. Every detail has been
              thoughtfully curated to ensure your little one's comfort and
              safety during their first professional photoshoot.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 text-background/70 text-sm uppercase tracking-[0.15em] font-sans"
            >
              <div className="flex items-center gap-2">
                <span className="w-8 h-px bg-background/50" />
                <span>Natural Light</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-px bg-background/50" />
                <span>Climate Controlled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-px bg-background/50" />
                <span>Premium Props</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default StudioTour;
