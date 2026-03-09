import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollReveal = () => {
  const containerRef = useRef(null);
  
  // Detectăm scroll-ul doar în interiorul acestei secțiuni
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Mapăm scroll-ul: la început scheletul are opacitate 0, la final 1
  const skeletonOpacity = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
  // Putem face și silueta neagră să devină puțin mai transparentă sau să rămână bază
  const silhouetteOpacity = useTransform(scrollYProgress, [0.3, 0.7], [1, 0.3]);

  return (
    <div ref={containerRef} className="h-[200vh] bg-transparent relative">
      {/* Sticky container - face ca imaginile să stea pe loc în timp ce dai scroll */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        
        <div className="relative w-full max-w-[600px] aspect-[1/2]">
          
          {/* Imaginea 1: Silueta Neagră (Baza) */}
          <motion.img
            style={{ opacity: silhouetteOpacity }}
            src="/images/full.png" 
            alt="Human Silhouette"
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Imaginea 2: Scheletul (Reveal) */}
          <motion.img
            style={{ opacity: skeletonOpacity }}
            src="/images/bone.png" 
            alt="Human Skeleton"
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Overlay Text care apare la finalul scanării */}
          <motion.div 
            style={{ opacity: skeletonOpacity }}
            className="absolute -right-20 top-1/2 -translate-y-1/2 text-left hidden md:block"
          >
            <div className="border-l-2 border-[#2da1ad] pl-6">
              <p className="text-[#2da1ad] font-mono text-xs uppercase tracking-[0.3em]">Deep Scan</p>
              <h2 className="text-white text-3xl font-black italic uppercase">Internal Structure</h2>
            </div>
          </motion.div>

        </div>

        {/* Indicator de progres lateral stil "Medical UI" */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Scanning</span>
            <div className="w-[2px] h-40 bg-white/5 relative">
                <motion.div 
                    style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
                    className="absolute top-0 w-full bg-[#2da1ad] shadow-[0_0_10px_#2da1ad]"
                />
            </div>
            <span className="text-[8px] font-mono text-[#2da1ad] uppercase">Depth</span>
        </div>
      </div>
    </div>
  );
};

export default ScrollReveal;