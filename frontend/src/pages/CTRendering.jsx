import React from 'react';

const CTRendering = () => {
    return (
        <section className="w-full h-[850px] relative bg-[#020202] rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            
            {/* Background decorativ - păstrat din stilul tău original */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#2da1ad]/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2da1ad]/5 rounded-full blur-[80px] animate-pulse" />
            </div>

            {/* Header VERA */}
            <div className="absolute top-10 left-10 z-30 pointer-events-none">
            <p className="text-[#2da1ad] text-[10px] font-black tracking-[0.3em] uppercase mb-2">Volume Rendering Engine</p>
        <h1 className="text-white text-4xl font-black italic tracking-tighter">
            VERA <span className="text-white/20 font-light not-italic">CT Explorer</span>
        </h1>
            </div>

            {/* Container Iframe pentru Python Dash */}
            <div className="absolute inset-0 z-10 w-full h-full pt-24 px-4 pb-4">
                <div className="w-full h-full rounded-[3rem] overflow-hidden border border-white/5 bg-black/40 backdrop-blur-md">
                    <iframe 
                        src="http://127.0.0.1:8050" 
                        className="w-full h-full border-none"
                        title="Python Backend Visualization"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
            </div>

            {/* Overlay decorativ pentru a "sigila" marginile iframe-ului */}
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 rounded-[4rem] z-20" />
            
        </section>
    );
};

export default CTRendering;