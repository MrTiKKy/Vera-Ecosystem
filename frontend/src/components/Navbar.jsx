export default function Navbar({ activeTab, setActiveTab }) {
    return (
      <header className="relative z-20 flex items-center justify-between px-12 py-12 max-w-7xl mx-auto">
        <button 
          onClick={() => setActiveTab('ct-rendering')}
          className={`px-8 py-3 rounded-2xl border transition-all text-[10px] tracking-widest font-black uppercase ${activeTab === 'ct-rendering' ? 'bg-[#2da1ad]/30 border-[#2da1ad] shadow-[0_0_20px_rgba(45,161,173,0.3)]' : 'border-white/10 text-gray-500 hover:text-white'}`}
        >
          3D CT Rendering
        </button>
  
        <div className="flex flex-col items-center cursor-pointer group" onClick={() => setActiveTab('home')}>
          <img src="/vera_logo.png" alt="VERA" className="w-20 h-auto mb-4 drop-shadow-[0_0_15px_rgba(45,161,173,0.8)] group-hover:scale-110 transition-transform duration-500" />
          <div className="text-6xl font-black tracking-[0.4em]">VERA</div>
          <span className="text-[9px] tracking-[1.2em] text-[#2da1ad] mt-3 uppercase font-bold opacity-80">Imaging Based Learning</span>
        </div>
  
        <button 
          onClick={() => setActiveTab('3d-atlas')}
          className={`px-8 py-3 rounded-2xl border transition-all text-[10px] tracking-widest font-black uppercase ${activeTab === '3d-atlas' ? 'bg-[#2da1ad]/30 border-[#2da1ad] shadow-[0_0_20px_rgba(45,161,173,0.3)]' : 'border-white/10 text-gray-500 hover:text-white'}`}
        >
          3D Atlas
        </button>
      </header>
    );
  }