import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import HeartModel from "../components/HeartModel";

const Atlas3D = () => {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [viewMode, setViewMode] = useState('menu'); // 'menu', 'selector', '3d', 'ai'
  const [activeModel, setActiveModel] = useState(null);
  
  // Stări pentru AI Detection integrate direct
  const [dragActive, setDragActive] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

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
    setChatHistory([{ 
      role: 'vera', 
      text: `SYSTEM INITIALIZED: Ready to analyze ${system.label} data. Awaiting scan upload...` 
    }]);
  };

  // Logica de Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setChatHistory(prev => [...prev, { role: 'user', text: `FILE_UPLOAD: ${file.name}` }]);
      
      // Simulare procesare AI (Aici vom lega API-ul Python ulterior)
      setTimeout(() => {
        setChatHistory(prev => [...prev, { role: 'vera', text: "ANALYSING VOLUMETRIC DATA... RUNNING PATHOLOGY DETECTION..." }]);
      }, 800);
    }
  };

  return (
    <section className="w-full h-[850px] bg-[#000] rounded-[4rem] border border-white/10 overflow-hidden relative flex flex-col p-10 font-sans">
      
      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <p className="text-[#2da1ad] text-[10px] font-black tracking-[0.3em] uppercase mb-2">Anatomical Database</p>
          <h1 className="text-white text-4xl font-black italic tracking-tighter">
              VERA <span className="text-white/20 font-light not-italic text-2xl">ATLAS Explorer</span>
          </h1>
        </div>
        {viewMode !== 'menu' && (
          <button 
            onClick={() => setViewMode('menu')}
            className="text-white/40 hover:text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 px-6 py-2 rounded-full transition-all bg-white/5"
          >
            ← BACK TO HUB
          </button>
        )}
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        {/* Sidebar */}
        <div className="w-[280px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {systems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSystemSelect(item)}
              className={`group relative p-6 rounded-3xl border transition-all duration-500 text-left ${
                selectedSystem?.id === item.id 
                ? 'bg-[#2da1ad] border-[#2da1ad] shadow-[0_0_30px_rgba(45,161,173,0.15)]' 
                : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between relative z-10">
                <span className={`font-bold tracking-tight ${selectedSystem?.id === item.id ? 'text-black' : 'text-white/70'}`}>
                  {item.label}
                </span>
                <span className={`text-[8px] font-mono ${selectedSystem?.id === item.id ? 'text-black/50' : 'text-[#2da1ad]'}`}>
                  {item.code}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Zona Centrala - Container Dinamic */}
        <div className="flex-1 relative rounded-[3.5rem] border border-white/5 bg-[#050505] overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            {!selectedSystem ? (
              <motion.div 
                key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-white/10 tracking-[0.5em] text-[10px] uppercase text-center p-20"
              >
                SELECT ANATOMICAL SYSTEM TO INITIALIZE ENGINE
              </motion.div>
            ) : viewMode === 'menu' ? (
              <motion.div
                key="menu" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                className="absolute inset-0 flex p-8 gap-8"
              >
                <button
                  className="flex-1 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-[#2da1ad]/40 transition-all group flex flex-col items-center justify-center gap-6"
                  onClick={() => setViewMode('selector')}
                >
                   <div className="w-12 h-12 border border-[#2da1ad]/40 rotate-45 group-hover:rotate-180 transition-transform duration-1000 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[#2da1ad] rounded-full" />
                   </div>
                   <div className="text-center">
                        <h3 className="text-white text-xl font-black uppercase tracking-tighter italic">3D Volumetric</h3>
                        <p className="text-[#2da1ad] text-[10px] font-bold tracking-widest mt-1 uppercase">Visualizer</p>
                    </div>
                </button>

                <button 
                  className="flex-1 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent hover:border-[#2da1ad]/40 transition-all group flex flex-col items-center justify-center gap-6"
                  onClick={() => setViewMode('ai')}
                >
                   <div className="w-12 h-12 rounded-full border border-dashed border-[#2da1ad]/40 group-hover:rotate-90 transition-transform duration-1000 flex items-center justify-center">
                      <div className="w-4 h-[1px] bg-[#2da1ad] animate-pulse" />
                   </div>
                   <div className="text-center">
                        <h3 className="text-white text-xl font-black uppercase tracking-tighter italic">AI Pathology</h3>
                        <p className="text-[#2da1ad] text-[10px] font-bold tracking-widest mt-1 uppercase">Detection</p>
                    </div>
                </button>
              </motion.div>
            ) : viewMode === 'selector' ? (
              <motion.div 
                key="selector" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 p-12 flex flex-col gap-4 overflow-y-auto"
              >
                <p className="text-[#2da1ad] text-[10px] font-black tracking-[0.3em] uppercase mb-4">Select Dataset: {selectedSystem.label}</p>
                {selectedSystem.models?.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { setActiveModel(model.path); setViewMode('3d'); }}
                    className="w-full p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#2da1ad]/50 transition-all text-left flex justify-between items-center group"
                  >
                    <span className="text-white font-bold group-hover:text-[#2da1ad] tracking-tight">{model.name}</span>
                    <span className="text-[#2da1ad] text-[9px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-all uppercase">Mount Model →</span>
                  </button>
                ))}
              </motion.div>
            ) : viewMode === 'ai' ? (
              <motion.div
                key="ai-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex p-8 gap-8"
              >
                {/* Zona de Drop */}
                <div className="flex-1 flex flex-col gap-4">
                    <p className="text-[#2da1ad] text-[10px] font-black tracking-widest uppercase italic">Pathology Input</p>
                    <div 
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      className={`flex-1 border-2 border-dashed rounded-[2.5rem] transition-all flex flex-col items-center justify-center p-10 text-center ${
                        dragActive ? 'border-[#2da1ad] bg-[#2da1ad]/5' : 'border-white/5 bg-white/[0.02]'
                      }`}
                    >
                      <div className="w-12 h-12 mb-4 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 rotate-45">
                        <span className="text-[#2da1ad] text-xl -rotate-45">+</span>
                      </div>
                      <p className="text-white/60 font-bold tracking-tight text-sm uppercase italic">Drop Medical Scan</p>
                      <p className="text-white/20 text-[8px] mt-2 uppercase tracking-[0.2em] font-mono">DICOM / NIFTI / SCAN</p>
                    </div>
                </div>

                {/* Zona de Chat VERA */}
                <div className="w-[380px] flex flex-col bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                   <div className="p-6 border-b border-white/5 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-[#2da1ad] rounded-full animate-pulse shadow-[0_0_8px_#2da1ad]" />
                      <span className="text-white font-black text-[10px] uppercase tracking-widest italic">Vera_Assistant_v.1</span>
                   </div>
                   <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 font-mono text-[10px]">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`p-4 rounded-2xl ${msg.role === 'vera' ? 'bg-[#2da1ad]/5 border border-[#2da1ad]/10 text-[#2da1ad]' : 'bg-white/5 text-white/70 self-end border border-white/5'}`}>
                           <span className="opacity-40 block mb-1">[{msg.role.toUpperCase()}]</span>
                           {msg.text}
                        </div>
                      ))}
                   </div>
                   <div className="p-4 bg-white/[0.02]">
                      <input 
                        className="w-full bg-transparent border border-white/10 rounded-full px-5 py-3 text-white text-[10px] focus:outline-none focus:border-[#2da1ad]/50"
                        placeholder="Type command or query..."
                      />
                   </div>
                </div>
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
                  {activeModel && <HeartModel path={activeModel} />}
                  <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={10} />
                  <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
                </Canvas>
                <div className="absolute bottom-10 left-10">
                  <p className="text-[#2da1ad] text-[10px] font-black tracking-widest uppercase mb-1 underline decoration-2 underline-offset-4">LIVE_RENDER_ACTIVE</p>
                  <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter">{selectedSystem.label}</h2>
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