/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Eye, 
  Camera, 
  Sparkles, 
  Circle,
  Wind,
  Maximize,
  Minimize
} from 'lucide-react';

// --- Constants & Config ---
const TOTAL_FRAMES = 6600;
const FPS = 30;
export const COLORS = {
  VOID: '#0a0a12',
  ATMOS: '#4da6ff',
  SUN: '#fff9e6',
  CYAN: '#00f5ff',
  SKY_BLUE: '#87ceeb',
  SKY_BRIGHT: '#e0f7ff',
  NAVY: '#0a1a3a',
  WHITE: '#ffffff',
  GRAY: '#808080'
};

// --- Types ---
interface BeatProps {
  frame: number;
  isActive: boolean;
}

// --- Helper Components ---

/**
 * Animated Typing Text component
 */
const TypingText: React.FC<{
  text: string;
  startFrame: number;
  currentFrame: number;
  speed?: number; // ms per char
  className?: string;
  glow?: boolean;
}> = ({ text, startFrame, currentFrame, speed = 80, className = "", glow = false }) => {
  const elapsedMs = ((currentFrame - startFrame) * 1000) / FPS;
  const visibleChars = Math.max(0, Math.floor(elapsedMs / speed));
  const displayedText = text.slice(0, visibleChars);
  
  return (
    <span className={`${className} ${glow ? 'text-glow-cyan' : ''}`}>
      {displayedText}
    </span>
  );
};

// --- Main Application ---

export default function App() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(null);

  // Frame Loop
  useEffect(() => {
    // Check if we are in render mode (e.g., via query param or global flag)
    const params = new URLSearchParams(window.location.search);
    const isRenderMode = params.get('mode') === 'render';

    if (isRenderMode) {
      setIsPlaying(false);
      // Expose a function to the window so Puppeteer can drive the animation
      (window as any).setAnimationFrame = (f: number) => {
        setFrame(f);
      };
      // Mark as ready
      (window as any).renderReady = true;
      return;
    }

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      
      if (isPlaying) {
        // Calculate frame based on elapsed time to keep it steady @ 30fps
        const elapsed = time - startTimeRef.current;
        const newFrame = Math.floor((elapsed / 1000) * FPS);
        
        if (newFrame < TOTAL_FRAMES) {
          setFrame(newFrame);
        } else {
          setIsPlaying(false);
          setFrame(TOTAL_FRAMES);
        }
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!isPlaying && frame >= TOTAL_FRAMES) {
      setFrame(0);
      startTimeRef.current = performance.now();
    } else if (!isPlaying) {
      // Adjust start time so it resumes from current frame
      startTimeRef.current = performance.now() - (frame / FPS) * 1000;
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = parseInt(e.target.value);
    setFrame(newFrame);
    startTimeRef.current = performance.now() - (newFrame / FPS) * 1000;
  };

  return (
    <div className="relative w-screen h-screen bg-void overflow-hidden flex flex-col font-sans select-none">
      {/* Background Layer */}
      <BackgroundLayer frame={frame} />
      
      {/* Particle & VFX Layer */}
      <VFXLayer frame={frame} />

      {/* Narrative Elements */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-8 text-center">
        <NarrativeLayer frame={frame} />
      </div>

      {/* Playback Controls (UI) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full max-w-2xl px-8 opacity-20 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-6 w-full">
          <button 
            onClick={togglePlay}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          
          <input 
            type="range" 
            min="0" 
            max={TOTAL_FRAMES} 
            value={frame} 
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan"
          />
          
          <div className="text-xs font-mono text-cyan w-20 text-right">
            {Math.floor(frame / FPS)}s / {Math.floor(TOTAL_FRAMES / FPS)}s
          </div>
        </div>
      </div>

      {/* Frame Counter for Dev (Optional) */}
      {/* <div className="absolute top-4 left-4 font-mono text-[10px] opacity-30">Frame: {frame}</div> */}
    </div>
  );
}

// --- Specialized Layers ---

const BackgroundLayer: React.FC<{ frame: number }> = ({ frame }) => {
  // Logic for background transitions
  
  const getBackgroundStyle = () => {
    // 0-600: Beat 1 & 2
    if (frame < 300) {
      return { 
        background: `radial-gradient(circle, #1a3a5c 0%, ${COLORS.VOID} 100%)` 
      };
    }
    
    // 300-600: Transition to Sky Blue
    if (frame < 600) {
      const progress = (frame - 300) / 300;
      return {
        background: `linear-gradient(to bottom, #1a3a5c, ${COLORS.SKY_BLUE})`,
        opacity: 1
      };
    }

    // 600-2100: Daytime
    if (frame < 2100) {
      return {
        background: `linear-gradient(to bottom, ${COLORS.SKY_BLUE}, ${COLORS.SKY_BRIGHT})`
      };
    }

    // 2100-2400: Night Transition
    if (frame < 2400) {
      const p = (frame - 2100) / 300;
      // Sky blue to deep navy to void
      if (p < 0.5) {
        return { background: `linear-gradient(to bottom, #87ceeb, #0a1a3a)` };
      }
      return { background: `linear-gradient(to bottom, #0a1a3a, ${COLORS.VOID})` };
    }

    // 2400+: Night Space
    return { background: COLORS.VOID };
  };

  return (
    <div 
      className="absolute inset-0 transition-all duration-300 pointer-events-none" 
      style={getBackgroundStyle()}
    >
      {/* Stars Layer (Fade in after frame 2100) */}
      {frame > 2100 && (
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: Math.min(1, (frame - 2100) / 300) }}
        >
          <Stars width={window.innerWidth} height={window.innerHeight} density={frame > 4500 ? 0.001 : 0.0005} />
        </div>
      )}
    </div>
  );
};

const NarrativeLayer: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <AnimatePresence mode="wait">
      {/* Beat 1: Opening Hook */}
      {frame >= 0 && frame < 300 && (
        <motion.div 
          key="beat1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="text-4xl md:text-6xl font-bold tracking-tight text-white max-w-4xl">
            <TypingText 
              text="To understand why the sky isn't " 
              startFrame={0} 
              currentFrame={frame} 
            />
            <span className={frame > 30 ? "text-cyan text-glow-cyan transition-all duration-1000" : "text-white"}>
              <TypingText text="blue " startFrame={130} currentFrame={frame} />
            </span>
            <TypingText text="at " startFrame={160} currentFrame={frame} />
            <span className={frame > 170 ? "text-cyan text-glow-cyan transition-all duration-1000" : "text-white"}>
              <TypingText text="night," startFrame={170} currentFrame={frame} />
            </span>
          </div>

          {frame > 150 && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-xl md:text-3xl font-medium text-white/80"
            >
              you first have to understand why it's blue during the day.
              {frame > 290 && (
                <motion.div 
                  className="absolute inset-0 bg-white/20 blur-xl mix-blend-overlay"
                  animate={{ x: [-500, 500] }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Beat 2: Core Concept */}
      {frame >= 300 && frame < 600 && (
        <motion.div 
          key="beat2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-8 max-w-3xl"
        >
          {frame < 420 && (
            <motion.div 
              className="text-3xl md:text-5xl font-bold italic text-white"
            >
              It isn't a permanent color;
              {frame > 350 && (
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="absolute inset-0 bottom-1/2 h-[2px] bg-cyan origin-left"
                />
              )}
            </motion.div>
          )}

          {frame >= 420 && frame < 510 && (
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-cyan"
            >
              it's a physical reaction
            </motion.div>
          )}

          {frame >= 510 && (
            <motion.div className="text-3xl md:text-5xl font-bold flex flex-wrap justify-center gap-4">
              <span>between</span>
              <span className="text-sun text-glow-sun">sunlight</span>
              <span>and our</span>
              <span className="text-atmos relative">
                atmosphere.
                <motion.div 
                  className="absolute inset-0 rounded-full bg-atmos/20 blur-lg"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Beat 3: Section Header – "THE DAYTIME BLUE" */}
      {frame >= 600 && frame < 900 && (
        <motion.div 
          key="beat3"
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="relative"
        >
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-atmos">
            THE DAYTIME BLUE
          </h2>
          {frame < 645 && (
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              className="absolute inset-0 border-4 border-atmos rounded-full"
            />
          )}
        </motion.div>
      )}

      {/* Beat 4: Sun Emits White Light */}
      {frame >= 900 && frame < 1200 && (
        <motion.div 
          key="beat4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-12"
        >
          <div className="text-4xl font-bold">
            {frame < 1020 ? (
              <span className={frame > 950 ? "text-white transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.8)]" : ""}>
                The sun emits white light,
              </span>
            ) : frame < 1110 ? (
              <div className="flex gap-2">
                {"which is actually a mix".split(" ").map((word, i) => (
                  <motion.span 
                    key={i}
                    animate={word === "mix" ? { x: [0, -10, 10, 0], color: ['#fff', '#f00', '#0f0', '#00f', '#fff'] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            ) : (
              <div className="flex gap-1 flex-wrap justify-center">
                <span>of all the colors of the rainbow.</span>
              </div>
            )}
          </div>
          
          {frame > 1050 && (
            <div className="flex gap-2">
              {['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'].map((color, i) => (
                <motion.div 
                  key={color}
                  initial={{ height: 0 }}
                  animate={{ height: 40 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Beat 5: Light Hits Atmosphere */}
      {frame >= 1200 && frame < 1500 && (
        <motion.div key="beat5" className="relative flex flex-col items-center">
          <div className="text-3xl font-bold mb-32 max-w-2xl">
            {frame < 1320 ? "When this light hits the Earth's atmosphere," :
             frame < 1410 ? "it crashes into gas molecules" :
             "and scatters in every direction."}
          </div>
          
          <div className="relative w-64 h-64 rounded-full bg-atmos/10 border border-atmos/30 flex items-center justify-center">
             <motion.div 
               className="w-full h-full rounded-full border-2 border-atmos"
               animate={frame > 1320 ? { scale: [1, 1.2, 1], opacity: [0.5, 0] } : {}}
               transition={{ duration: 1, repeat: 3 }}
             />
             {/* Molecule dots */}
             {frame > 1350 && Array.from({ length: 15 }).map((_, i) => (
               <motion.div 
                 key={i}
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="absolute w-2 h-2 bg-white rounded-full"
                 style={{ 
                   top: `${Math.random() * 100}%`, 
                   left: `${Math.random() * 100}%` 
                 }}
               />
             ))}
          </div>
        </motion.div>
      )}

      {/* Beat 6: Blue Light Scatters More */}
      {frame >= 1500 && frame < 1800 && (
        <motion.div key="beat6" className="flex flex-col items-center gap-12 max-w-3xl">
          <div className="text-3xl font-bold text-center">
            {frame < 1600 ? <span className="text-atmos">Because blue light travels</span> :
             frame < 1700 ? "in shorter, smaller waves," :
             "it gets scattered much more strongly than other colors."}
          </div>
          
          <div className="flex flex-col gap-8 w-full">
            {/* Wave Comparison */}
            <div className="relative h-20 w-full bg-white/5 rounded-xl flex items-center px-4">
              <span className="text-xs font-mono w-24">RED (Long)</span>
              <svg className="flex-1 h-full">
                <path 
                  d={`M 0 40 ${Array.from({ length: 20 }).map((_, i) => `Q ${i * 40 + 20} ${i % 2 === 0 ? 20 : 60}, ${i * 40 + 40} 40`).join(" ")}`}
                  fill="none"
                  stroke="#ff4d4d"
                  strokeWidth="2"
                  className="animate-[dash_10s_linear_infinite]"
                />
              </svg>
            </div>
            
            <div className="relative h-20 w-full bg-white/5 rounded-xl flex items-center px-4">
              <span className="text-xs font-mono w-24 text-atmos">BLUE (Short)</span>
              <svg className="flex-1 h-full">
                <path 
                  d={`M 0 40 ${Array.from({ length: 60 }).map((_, i) => `Q ${i * 13 + 6} ${i % 2 === 0 ? 30 : 50}, ${i * 13 + 13} 40`).join(" ")}`}
                  fill="none"
                  stroke={COLORS.ATMOS}
                  strokeWidth="2"
                  className="animate-[dash_2s_linear_infinite]"
                />
              </svg>
            </div>
          </div>
        </motion.div>
      )}

      {/* Beat 7: Seeing Scattered Blue */}
      {frame >= 1800 && frame < 2100 && (
        <motion.div key="beat7" className="relative flex flex-col items-center">
          <div className="text-3xl italic max-w-xl mb-12">
            "During the day, no matter which direction you look..."
          </div>
          <div className="relative w-48 h-48 flex items-center justify-center">
             <Eye size={80} className="text-white z-10" />
             {Array.from({ length: 12 }).map((_, i) => (
               <motion.div 
                 key={i}
                 className="absolute inset-0 flex items-center justify-center"
                 animate={{ rotate: i * 30 + (frame - 1800) }}
               >
                 <div className="w-1 h-64 bg-gradient-to-t from-atmos/0 via-atmos to-atmos/0 opacity-30" />
               </motion.div>
             ))}
          </div>
          <div className="mt-12 text-2xl font-bold text-atmos text-glow-cyan">
             you are seeing this scattered blue light hitting your eyes from every angle.
          </div>
        </motion.div>
      )}

      {/* Beat 8: Section Header – "THE NIGHTTIME SHADOW" */}
      {frame >= 2100 && frame < 2400 && (
        <motion.div 
          key="beat8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="relative text-center"
        >
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter text-white/90">
            THE NIGHTTIME SHADOW
          </h2>
          {frame > 2250 && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: '-100%' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-black mix-blend-multiply h-[200%] -top-1/2"
            />
          )}
        </motion.div>
      )}

      {/* Beat 9-11: Night Logic */}
      {frame >= 2400 && frame < 3300 && (
        <motion.div key="beat9" className="flex flex-col items-center gap-12">
            <div className="text-4xl font-bold max-w-2xl">
              {frame < 2700 ? "The simple reason there is no blue sky at night is that the source of light is gone." :
               frame < 3000 ? "As the Earth rotates, your location moves into the planet's own shadow." :
               "Without direct sunlight hitting the atmosphere above you, there is no light to be scattered."}
            </div>
            
            <div className="relative w-64 h-64 overflow-hidden rounded-full border border-white/10 bg-black">
               <motion.div 
                 className="absolute inset-0 bg-gradient-to-r from-sun/20 via-transparent to-black"
                 animate={{ x: frame < 2700 ? 0 : -300 }}
                 transition={{ duration: 2 }}
               />
               <GlobeIcon className="absolute inset-0 p-4 opacity-40 animate-spin-slow" />
            </div>
        </motion.div>
      )}

      {/* Beat 12-16: Vacuum of Space */}
      {frame >= 3300 && frame < 4800 && (
        <motion.div key="beat12" className="flex flex-col items-center gap-8">
           <div className="text-5xl font-black tracking-widest text-white/20 uppercase">
             {frame < 3600 ? "Looking Into The Void" : 
              frame < 4200 ? "Atmosphere becomes transparent" :
              "True color of the universe"}
           </div>
           
           <div className="text-2xl md:text-3xl max-w-3xl font-light leading-relaxed">
             {frame >= 3900 && frame < 4200 && (
               <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 Instead of seeing a ceiling of blue light, you are looking through the thin layer of our air...
               </motion.span>
             )}
             {frame >= 4200 && frame < 4500 && (
               <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                 <span className="text-4xl tracking-[1em]">Space is black</span>
                 <span className="opacity-50">because it is mostly empty.</span>
               </motion.span>
             )}
           </div>
        </motion.div>
      )}

      {/* Beat 17-21: Moonlight */}
      {frame >= 4800 && frame < 6300 && (
        <motion.div key="beat17" className="flex flex-col items-center gap-8">
           <div className="flex items-center gap-4 text-4xl font-bold text-white/80">
              <Moon size={40} className="text-sun/50" />
              <span>THE LIMIT OF MOONLIGHT</span>
           </div>
           
           <div className="text-2xl max-w-2xl opacity-70">
              {frame < 5400 ? "But wait—doesn't the Moon reflect sunlight? Why doesn't it turn the sky blue?" :
               frame < 5700 ? "While the Moon does reflect sunlight, it is hundreds of thousands of times dimmer than the Sun." :
               frame < 6000 ? "There simply isn't enough energy in moonlight to scatter enough blue light for our eyes to perceive it." :
               "To a high-powered camera, it might look navy, but to the human eye, it remains black."}
           </div>
           
           <AnimatePresence>
             {frame > 5520 && frame < 5700 && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="w-full max-w-md bg-white/5 p-6 rounded-2xl border border-white/10"
               >
                 <div className="flex justify-between items-end gap-4 h-40">
                    <div className="flex-1 flex flex-col items-center gap-2">
                       <div className="w-full bg-sun rounded-t h-full shadow-[0_0_20px_#fff9e6]" />
                       <span className="text-[10px] font-mono">SUN</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                       <motion.div 
                          className="w-full bg-sun/20 rounded-t" 
                          animate={{ height: ['0.1%', '0.5%', '0.1%'] }} 
                          transition={{ repeat: Infinity }}
                        />
                       <span className="text-[10px] font-mono opacity-50">MOON</span>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </motion.div>
      )}

      {/* Beat 22: Closing */}
      {frame >= 6300 && (
        <motion.div 
          key="beat22"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-12"
        >
          <div className="text-4xl font-bold">
            Essentially, the sky doesn't turn black at night—
          </div>
          <motion.div 
            className="text-6xl md:text-8xl font-black text-cyan"
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            it just stops glowing blue.
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="text-white/20 font-mono tracking-widest text-sm"
          >
            WHY NIGHT HAS NO BLUE • COSMIC MINIMALISM
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Sub-components (Visual Assets) ---

const Stars: React.FC<{ width: number, height: number, density?: number }> = ({ width, height, density = 0.0005 }) => {
  const count = Math.floor(width * height * density);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      const opacity = Math.random();
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [width, height, count]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />;
};

const VFXLayer: React.FC<{ frame: number }> = ({ frame }) => {
  // Logic for particle systems
  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
       {/* Global Dust Particles */}
       {frame < 2100 && (
         <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                animate={{ 
                  y: [-20, window.innerHeight + 20],
                  x: (Math.random() - 0.5) * 50
                }}
                transition={{ 
                  duration: 5 + Math.random() * 10, 
                  repeat: Infinity,
                  delay: Math.random() * 10
                }}
                style={{ 
                  left: `${Math.random() * 100}%`,
                  top: '-20px'
                }}
              />
            ))}
         </div>
       )}

       {/* Scattering Burst Beat 3 */}
       {frame > 615 && frame < 660 && (
         <motion.div 
           initial={{ scale: 0, opacity: 1 }}
           animate={{ scale: 3, opacity: 0 }}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-atmos/30 blur-3xl"
         />
       )}
    </div>
  );
};

// Simple Globe Icon representation
const GlobeIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <div className="w-full h-full rounded-full border-2 border-white/20 relative">
      <div className="absolute inset-0 flex flex-col gap-4 opacity-20 py-8">
        <div className="h-4 bg-white rounded-full mx-4" />
        <div className="h-4 bg-white rounded-full mx-2" />
        <div className="h-4 bg-white rounded-full mx-6" />
      </div>
    </div>
  </div>
);
