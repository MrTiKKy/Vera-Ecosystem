import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import HeartModel from "../components/HeartModel";

const Atlas3D = () => {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [viewMode, setViewMode] = useState('menu'); // 'menu', 'selector' sau '3d'
  const [activeModel, setActiveModel] = useState(null);

  const systems = [
    { id: 'teeth', label: 'Mouth and Teeth', code: 'SYS-01', 
    models: [
      { id: 't1', name: 'Human Mouth', path: '/models/human_mouth.glb' }
    ] 
  },
    { id: 'lung', label: 'Thorax & Lungs', code: 'SYS-02', 
    models: [
      { id: 'l1', name: 'Left Lung', path: '/models/left_lung.glb' },
      { id: 'l2', name: 'Right Lung', path: '/models/right_lung.glb' },
      { id: 'l3', name: 'Left and Right Lungs', path: '/models/BothLungs.glb' }
    ] 
  },
    { id: 'heart', label: 'Cardiovascular', code: 'SYS-03', 
      models: [
        { id: 'h1', name: 'Whole Human Heart', path: '/models/inima1.glb' },
        { id: 'h2', name: 'Cornal Heart Section', path: '/models/inima2.glb' },
        { id: 'h3', name: 'Axial Heart Section', path: '/models/axialsection.glb' },
        { id: 'h4', name: 'Coronary Arteries', path: '/models/VaseCoronare.glb' },
        { id: 'h5', name: 'Aorta', path: '/models/aorta.glb' }
      ] 
    },
    { id: 'brain', label: 'Neurological', code: 'SYS-04',
      models: [
        { id: 'b1', name: 'Cerebellum Model', path: '/models/cerebel.glb' },
        { id: 'b2', name: 'Half Brain Section', path: '/models/half_brain.glb' },
        { id: 'b3', name: 'Human Skull Base', path: '/models/human_skull.glb' },
        { id: 'b4', name: 'Full Human Skull', path: '/models/full_human_skull.glb' },
        { id: 'b5', name: 'Extra and Intra Cranial Arteries', path: '/models/VaseCreier.glb' },
        { id: 'b6', name: 'Inside of the Brain', path: '/models/TroughBrain.glb' },
        { id: 'b7', name: 'Ventricular System', path: '/models/ventricular_system.glb' }
      ]
    },
  ];

  const handleSystemSelect = (system) => {
    setSelectedSystem(system);
    setViewMode('menu'); 
  };

  return (
    <section className="w-full h-[850px] bg-[#000] rounded-[4rem] border border-white/10 overflow-hidden relative flex flex-col p-10">
      
      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <p className="text-[#2da1ad] text-[10px] font-black tracking-[0.3em] uppercase mb-2">Anatomical Database</p>
          <h1 className="text-white text-4xl font-black italic tracking-tighter">
              VERA <span className="text-white/20 font-light not-italic">ATLAS Explorer</span>
          </h1>
        </div>
        {viewMode !== 'menu' && (
          <button 
            onClick={() => setViewMode(viewMode === '3d' ? 'selector' : 'menu')}
            className="text-white/40 hover:text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 px-4 py-2 rounded-full transition-all"
          >
            ← {viewMode === '3d' ? 'Back to Selector' : 'Back to Options'}
          </button>
        )}
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        {/* Sidebar */}
        <div className="w-[280px] flex flex-col gap-4">
          {systems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSystemSelect(item)}
              className={`group relative p-6 rounded-3xl border transition-all duration-500 text-left ${
                selectedSystem?.id === item.id 
                ? 'bg-[#2da1ad] border-[#2da1ad]' 
                : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between relative z-10">
                <span className={`font-bold tracking-tight ${selectedSystem?.id === item.id ? 'text-black' : 'text-white/70'}`}>
                  {item.label}
                </span>
                <span className="text-[8px] font-mono opacity-50">{item.code}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Zona Centrala */}
        <div className="flex-1 relative rounded-[3.5rem] border border-white/5 bg-[#050505] overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedSystem ? (
              <motion.div 
                key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-white/10 tracking-[0.5em] text-xs uppercase text-center p-20"
              >
                Select anatomical system to initialize
              </motion.div>
            ) : viewMode === 'menu' ? (
              <motion.div
                key="menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="absolute inset-0 flex p-8 gap-8"
              >
                <button
                  className="flex-1 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-[#2da1ad]/40 transition-all group flex flex-col items-center justify-center gap-6"
                  onClick={() => setViewMode('selector')}
                >
                   <div className="w-12 h-12 border border-[#2da1ad]/40 rotate-45 group-hover:rotate-180 transition-transform duration-700" />
                   <div className="text-center">
                        <h3 className="text-white text-xl font-black uppercase tracking-tighter italic">3D Volumetric</h3>
                        <p className="text-[#2da1ad] text-[10px] font-bold tracking-widest mt-1">OPEN RENDERER</p>
                    </div>
                </button>

                <button className="flex-1 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent opacity-40 cursor-not-allowed flex flex-col items-center justify-center gap-6">
                  <div className="text-white/20 text-xs font-mono">AI_DISABLED</div>
                  <div className="text-center">
                        <h3 className="text-white/20 text-xl font-black uppercase tracking-tighter italic">AI Pathology coming soon</h3>
                    </div>
                </button>
              </motion.div>
            ) : viewMode === 'selector' ? (
              <motion.div 
                key="selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 p-12 flex flex-col gap-4 overflow-y-auto"
              >
                <p className="text-[#2da1ad] text-[10px] font-black tracking-widest uppercase mb-4">Select Dataset</p>
                {selectedSystem.models?.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { setActiveModel(model.path); setViewMode('3d'); }}
                    className="w-full p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#2da1ad]/50 hover:bg-[#2da1ad]/5 transition-all text-left flex justify-between items-center group"
                  >
                    <span className="text-white font-bold group-hover:text-[#2da1ad] transition-colors">{model.name}</span>
                    <span className="text-[#2da1ad] text-[10px] font-mono tracking-widest uppercase">Select Model →</span>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="3d-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <color attach="background" args={['#050505']} />
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
                  
                  {/* ÎNLOCUIEȘTE LINIA 136 CU ASTA: */}
                  {activeModel && <HeartModel path={activeModel} />}
                  
                  <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={10} />
                  <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
                </Canvas>

                <div className="absolute bottom-10 left-10 pointer-events-none">
                  <p className="text-[#2da1ad] text-[10px] font-black tracking-widest uppercase">Live Render</p>
                  <h2 className="text-white text-2xl font-black italic uppercase">{selectedSystem.label}</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Atlas3D;