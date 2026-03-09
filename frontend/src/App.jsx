import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CTRendering from './pages/CTRendering';
import Atlas3D from './pages/Atlas3D';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-[#020202] text-white relative overflow-x-hidden font-sans">
      {/* Background Glows - le păstrăm, dar cu pointer-events-none */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#2da1ad]/10 rounded-full blur-[120px] animate-pulse pointer-events-none z-0"></div>
      
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="relative z-10">
        {activeTab === 'home' && <Home />}
        
        {/* Pentru celelalte pagini, păstrăm padding-ul și lățimea limitată */}
        {(activeTab === 'ct-rendering' || activeTab === '3d-atlas') && (
          <div className="max-w-7xl mx-auto px-6 pb-20">
            {activeTab === 'ct-rendering' && <CTRendering />}
            {activeTab === '3d-atlas' && <Atlas3D />}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}