import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Float, Center, Stage } from '@react-three/drei';
import { motion } from 'framer-motion';

// --- Componenta pentru Modelul 3D ---
function UltraShadowBrain() {
  const { scene } = useGLTF('/models/homepage_brain.glb');

  return (
    <Float 
      speed={1.6} 
      rotationIntensity={3.4} 
      floatIntensity={0.2}
    >
      <Stage 
        environment={null} 
        intensity={0.1} 
        contactShadow={false} 
        adjustCamera={true}
      >
        <Center>
          <primitive object={scene}>
            <meshStandardMaterial 
              color="#050505" 
              metalness={1} 
              roughness={0.3} 
            />
          </primitive>
        </Center>
      </Stage>
    </Float>
  );
}

// --- Componenta Principală Hero ---
const Hero = () => {
  return (
    <section className="relative w-full h-screen bg-transparent overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background 3D Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 35 }}
          style={{ pointerEvents: 'none' }}
          dpr={1} 
          gl={{
            antialias: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
          }}
        >
          <pointLight position={[0, 0, 10]} intensity={0.1} color="#ffffff" />
          
          <Suspense fallback={null}>
            <UltraShadowBrain />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <div className="relative z-10 text-center px-4 select-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
        >
          {/* Main Title */}
          <h1 
            className="text-white text-7xl md:text-9xl font-black italic tracking-tighter leading-none mb-4"
            style={{ filter: 'drop-shadow(0 0 20px rgba(45,161,173,0.6))' }}
          >
            MEDICAL<br />
            <span className="text-[#2da1ad] brightness-125">
              IMAGING
            </span>
          </h1>

          {/* Decorative Divider */}
          <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-[#2da1ad] to-transparent mx-auto my-8 shadow-[0_0_15px_#2da1ad]" />

          {/* Subtitle */}
          <p className="text-white font-bold tracking-[0.6em] text-[10px] uppercase opacity-90">
            Future of Anatomy
          </p>
        </motion.div>
      </div>

    </section>
  );
};

export default Hero;