import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ className, children }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md flex flex-col overflow-hidden group hover:border-[#2da1ad]/50 transition-all ${className}`}
  >
    {children}
  </motion.div>
);

const FeaturesGrid = () => {
  return (
    <section className="w-full py-20 bg-transparent px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
        
        {/* NEW: Header Grid - Tehnologii de top */}
        <div className="md:col-span-3 flex flex-col justify-center mb-10 text-center md:text-left px-4">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-white text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-[0.9]"
          >
            VERA brings together top-tier technologies from companies such as <span className="text-[#2da1ad]">Rayscape</span>, <span className="text-[#2da1ad]">Axial3D</span> and others.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/50 text-sm md:text-base mt-4 uppercase tracking-[0.2em] font-medium max-w-4xl"
          >
            From clinics equipped with state-of-the-art technologies, these are now made available in an integrated and compact format to all students and residents.
          </motion.p>
        </div>

        {/* 1. Volumetric Rendering */}
        <FeatureCard className="md:col-span-2 flex-row items-center">
          <div className="w-1/2 p-12">
            <h3 className="text-white text-3xl font-black uppercase tracking-tighter italic leading-none">
              Volumetric<br/>Rendering
            </h3>
            <p className="text-[#2da1ad] text-xs font-bold tracking-widest uppercase mt-2">
              Real-time 3D reconstruction
            </p>
          </div>
          <div className="w-1/2 h-full p-8 flex items-center justify-center">
            <motion.img 
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              src="/images/VolumetricRendering.png" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </FeatureCard>
        
        {/* 2. Pathology AI */}
        <FeatureCard className="md:row-span-2 flex-col">
          <div className="h-[75%] p-10 flex items-center justify-center">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              src="/images/XrayBBox.png" 
              className="max-w-full max-h-full object-contain rounded-2xl" 
            />
          </div>
          <div className="h-[25%] flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-white text-xl font-bold uppercase tracking-tighter italic">Pathology AI</h3>
            <p className="text-[#2da1ad] text-[10px] font-bold tracking-widest uppercase mt-1">Diagnostic Engine</p>
          </div>
        </FeatureCard>
        
        {/* 3. 3D Models */}
        <FeatureCard className="flex-col">
          <div className="h-2/3 p-10 flex items-center justify-center">
            <motion.img 
              whileHover={{ scale: 1.3 }}
              transition={{ duration: 0.7 }}
              src="/images/3DModel.png" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
          <div className="p-8 pt-0 flex flex-col items-start">
            <h3 className="text-white text-xl font-bold uppercase tracking-tighter italic">3D Models</h3>
            <p className="text-[#2da1ad] text-[10px] font-bold tracking-widest uppercase mt-1">Cross-anatomical models</p>
          </div>
        </FeatureCard>
        
        {/* 4. Cross-Platform */}
        <FeatureCard className="flex-col">
          <div className="h-2/3 p-10 flex items-center justify-center">
            <motion.img 
              whileHover={{ scale: 1.3 }}
              transition={{ duration: 0.7 }}
              src="/images/CrossPlatform.png" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
          <div className="p-8 pt-0 flex flex-col items-start">
            <h3 className="text-white text-xl font-bold uppercase tracking-tighter italic">Cross-Platform</h3>
            <p className="text-[#2da1ad] text-[10px] font-bold tracking-widest uppercase mt-1">Cloud database access</p>
          </div>
        </FeatureCard>

      </div>
    </section>
  );
};

export default FeaturesGrid;