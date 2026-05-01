/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';

// --- Constants & Config ---
const TOTAL_FRAMES = 7500; // 25 beats * 300 frames
const FPS = 30;
export const COLORS = {
  VOID: '#0a0a0a',
  ADAMANTIUM: '#8a95a5',
  CRIMSON: '#c1121f',
  BONE: '#fdfbf7',
  REGEN: '#00ff88',
  GOLD: '#f4d03f',
  DARK_BLUE: '#1e3a5f'
};

const EASE_SMOOTH_IMPACT = [0.22, 1, 0.36, 1];
const EASE_ELASTIC_BOUNCE = [0.68, -0.55, 0.265, 1.55];

// --- Types ---
interface BeatProps {
  frame: number;
}

// --- Specialized Components ---

const StaggeredText: React.FC<{
  text: string;
  startFrame: number;
  currentFrame: number;
  stagger?: number; // frames per char
  className?: string;
}> = ({ text, startFrame, currentFrame, stagger = 1, className = "" }) => {
  const visibleCount = Math.max(0, (currentFrame - startFrame) / stagger);
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span 
          key={i} 
          className="transition-opacity duration-300" 
          style={{ opacity: i <= visibleCount ? 1 : 0 }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

// --- App Component ---

export default function App() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(null);

  // Setup for Render/CI mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'render') {
      setIsPlaying(false);
      (window as any).setAnimationFrame = (f: number) => setFrame(f);
      (window as any).renderReady = true;
      return;
    }

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      if (isPlaying) {
        const elapsed = time - startTimeRef.current;
        const newFrame = Math.floor((elapsed / 1000) * FPS);
        if (newFrame < TOTAL_FRAMES) setFrame(newFrame);
        else { setIsPlaying(false); setFrame(TOTAL_FRAMES); }
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying]);

  return (
    <div className="relative w-screen h-screen bg-void overflow-hidden flex flex-col font-sans select-none text-bone">
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="absolute inset-0 bg-void opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/60-lines.png")' }} />
        <motion.div 
          className="absolute inset-0 border-[20px] border-void pointer-events-none"
          animate={{ opacity: [0.1, 0.15, 0.1] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />
      </div>

      {/* Main Visual Stage */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
        <NarrativeLayer frame={frame} />
      </div>

      {/* Playback Controls (UI) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 w-full max-w-xl px-8 opacity-10 hover:opacity-100 transition-opacity">
        <input 
          type="range" 
          min="0" 
          max={TOTAL_FRAMES} 
          value={frame} 
          onChange={(e) => {
            const f = parseInt(e.target.value);
            setFrame(f);
            startTimeRef.current = performance.now() - (f / FPS) * 1000;
          }}
          className="flex-1 h-1 bg-bone/20 rounded-lg appearance-none cursor-pointer accent-crimson"
        />
        <div className="text-[10px] font-mono text-bone opacity-50 w-24">
          BEAT {Math.floor(frame/300) + 1} • F{frame}
        </div>
      </div>
    </div>
  );
}

// --- Narrative Logic ---

const NarrativeLayer: React.FC<{ frame: number }> = ({ frame }) => {
  const beat = Math.floor(frame / 300);
  const beatFrame = frame % 300;

  return (
    <AnimatePresence mode="wait">
      {/* Beat 01: Hook */}
      {beat === 0 && (
        <motion.div 
          key="beat1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="flex flex-col items-center gap-4 font-mono uppercase tracking-[20px]"
        >
          <div className="text-3xl text-center">
            <StaggeredText text="In a world where pain doesn’t last…" startFrame={0} currentFrame={frame} stagger={1.35} />
          </div>
          {beatFrame > 126 && (
            <motion.div 
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ease: EASE_ELASTIC_BOUNCE, duration: 1 }}
              className="text-4xl font-bold"
            >
              two men refuse to <span className="text-crimson">die.</span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Beat 02: Wolverine Weapon */}
      {beat === 1 && (
        <motion.div 
          key="beat2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative flex flex-col items-center"
        >
          <motion.h1 
            initial={{ y: -120, scale: 1.12 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ ease: "circOut", duration: 0.8 }}
            className="text-[120px] font-sans font-black tracking-tighter text-adamantium leading-none"
          >
            ONE IS A WEAPON
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-4xl font-sans tracking-widest mt-4 opacity-40 uppercase"
          >
            FORGED BY WAR…
          </motion.div>
        </motion.div>
      )}

      {/* Beat 03: Deadpool Intro */}
      {beat === 2 && (
        <motion.div 
          key="beat3"
          className="flex flex-col items-start gap-2 max-w-4xl"
        >
          <motion.div 
            initial={{ rotate: -4, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            className="text-5xl font-mono"
          >
            The other?
          </motion.div>
          {beatFrame > 36 && (
            <div className="text-7xl font-sans font-black text-white/90 leading-tight">
              A WEAPON WHO WON’T STOP <span className="text-crimson/80 animate-pulse italic">TALKING.</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Beat 04: WOLVERINE VS DEADPOOL */}
      {beat === 3 && (
        <motion.div 
          key="beat4"
          className="flex items-center gap-8 font-sans font-black text-[110px]"
        >
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ease: EASE_SMOOTH_IMPACT, duration: 0.6 }}
            className="text-adamantium"
          >
            WOLVERINE
          </motion.div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            className="text-3xl text-gold mx-4"
          >
            VS
          </motion.div>
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ease: EASE_SMOOTH_IMPACT, duration: 0.6 }}
            className="text-crimson"
          >
            DEADPOOL
          </motion.div>
        </motion.div>
      )}

      {/* Beat 05-06: Focus Frames */}
      {(beat === 4 || beat === 5) && (
        <motion.div 
          key={`beat${beat}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <div className={`text-[120px] font-black uppercase ${beat === 4 ? 'text-adamantium' : 'text-crimson'}`}>
            {beat === 4 ? 'WOLVERINE.' : 'DEADPOOL.'}
          </div>
          <div className="text-2xl font-mono tracking-widest opacity-60">
            {beat === 4 ? 'ADAMANTIUM CLAWS. ANIMAL INSTINCT.' : 'REGENERATING CHAOS IN A RED SUIT.'}
          </div>
        </motion.div>
      )}

      {/* Beat 07: Both Heal */}
      {beat === 6 && (
        <div className="flex flex-col items-center gap-16 w-full">
           <motion.div 
             initial={{ x: -100, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="text-8xl font-black text-regen text-glow"
           >
             BOTH HEAL.
           </motion.div>
           <motion.div className="w-full h-[2px] bg-white/10" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} />
           <motion.div 
             initial={{ x: 100, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="text-8xl font-black text-crimson"
           >
             BOTH KILL.
           </motion.div>
        </div>
      )}

      {/* Beat 08: Logic Comparison */}
      {beat === 7 && (
        <div className="flex flex-col md:flex-row items-center justify-center gap-20 w-full px-20">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-mono text-dark_blue max-w-md"
          >
            Wolverine fights with precision—
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50, rotate: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-6xl font-black text-crimson max-w-md"
          >
            Deadpool fights like the rules don’t exist.
          </motion.div>
        </div>
      )}

      {/* Beat 09: Minimalist Pause */}
      {beat === 8 && (
        <motion.div 
          key="beat9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-8 font-mono text-6xl"
        >
          <div>And maybe…</div>
          {beatFrame > 60 && (
            <motion.div 
              initial={{ scaleY: 0.3, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              className="text-8xl font-black text-crimson"
            >
              THEY DON’T.
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Beat 10: Combat Stagger */}
      {beat === 9 && (
        <div className="relative flex flex-col gap-12 text-7xl font-black tracking-tighter">
          <motion.div initial={{ x: -200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-bone">STEEL CLASHES.</motion.div>
          <motion.div initial={{ x: 200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-adamantium">BULLETS FLY.</motion.div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, ease: EASE_ELASTIC_BOUNCE }} className="text-crimson">CLAWS MEET KATANAS.</motion.div>
        </div>
      )}

      {/* Beat 11: Wolverine Charge */}
      {beat === 10 && (
        <motion.div 
          initial={{ x: -400, scale: 0.8 }}
          animate={{ x: 0, scale: 1.5 }}
          transition={{ ease: EASE_SMOOTH_IMPACT, duration: 2 }}
          className="text-[140px] font-black text-adamantium italic -skew-x-12"
        >
          WOLVERINE CHARGES
        </motion.div>
      )}

      {/* Beat 12: Deadpool Dodge */}
      {beat === 11 && (
        <motion.div 
          animate={{ x: [0, 200, -200, 100, -50, 0], y: [0, -100, 150, -50, 100, 0] }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="text-6xl font-mono text-crimson flex flex-col items-center"
        >
          <span className="text-9xl font-black">DEADPOOL DODGES</span>
          <span className="opacity-50 tracking-[1em]">LAUGHING</span>
        </motion.div>
      )}

      {/* Beat 13: Fracture & Heal */}
      {beat === 12 && (
        <div className="flex flex-col items-center gap-10">
          <motion.div 
            animate={{ letterSpacing: beatFrame < 45 ? "0px" : "40px", opacity: beatFrame < 45 ? 1 : 0.5 }}
            className="text-8xl font-black text-bone"
          >
            BONES BREAK.
          </motion.div>
          {beatFrame > 60 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="text-9xl font-black text-regen text-glow"
            >
              THEY’RE BACK.
            </motion.div>
          )}
        </div>
      )}

      {/* Beat 14: Again and Again */}
      {beat === 13 && (
        <div className="flex flex-col gap-4 text-8xl font-black">
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>AGAIN.</motion.div>
          {beatFrame > 40 && <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }}>AND AGAIN.</motion.div>}
          {beatFrame > 80 && <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.1 }} className="text-crimson">AND AGAIN.</motion.div>}
        </div>
      )}

      {/* Beat 15: The Problem */}
      {beat === 14 && (
        <motion.div 
          initial={{ opacity: 0, tracking: "40px" }}
          animate={{ opacity: 1, tracking: "10px" }}
          className="text-6xl font-mono"
        >
          HERE’S THE PROBLEM.
        </motion.div>
      )}

      {/* Beat 16: Relentless */}
      {beat === 15 && (
        <div className="flex flex-col items-center gap-20">
          <div className="text-5xl font-mono">You can’t outlast someone…</div>
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="text-8xl font-black text-crimson underline decoration-8 underline-offset-12"
          >
            WHO REFUSES TO STAY DOWN.
          </motion.div>
        </div>
      )}

      {/* Beat 17: Rage vs Insanity */}
      {beat === 16 && (
        <div className="flex gap-40 text-7xl font-black uppercase">
          <motion.div animate={{ skewY: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="text-dark_blue">RAGE FUELS</motion.div>
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-crimson">INSANITY FREES</motion.div>
        </div>
      )}

      {/* Beat 18: One Fights / One Enjoys */}
      {beat === 17 && (
        <div className="flex flex-col items-center gap-8">
           <motion.div initial={{ x: -200 }} animate={{ x: 0 }} className="text-6xl font-sans font-black">ONE FIGHTS TO END IT.</motion.div>
           <div className="text-bone/20">•</div>
           <motion.div 
              animate={{ x: [0, -10, 10, -5, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-6xl font-mono text-gold"
            >
              JUST ENJOYS THE CHAOS.
            </motion.div>
        </div>
      )}

      {/* Beat 19: Who Wins? */}
      {beat === 18 && (
        <motion.div 
          animate={{ color: [COLORS.ADAMANTIUM, COLORS.CRIMSON, COLORS.GOLD, COLORS.ADAMANTIUM] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[160px] font-black"
        >
          SO WHO WINS?
        </motion.div>
      )}

      {/* Beat 20-21: Summarized Stats */}
      {beat === 19 && (
        <div className="flex flex-col gap-12 text-7xl font-sans font-black px-20">
          <div className="text-adamantium flex items-baseline gap-4">STRENGTH? <span className="text-3xl font-mono text-bone/40">WOLVERINE</span></div>
          <div className="text-crimson flex items-baseline gap-4">CHAOS? <span className="text-3xl font-mono text-bone/40">DEADPOOL</span></div>
        </div>
      )}

      {/* Beat 22: No Winner */}
      {beat === 21 && (
        <motion.div 
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[120px] font-black tracking-widest flex flex-col items-center"
        >
          <span>THERE IS NO</span>
          <span className="text-crimson glitch-text">WINNER.</span>
        </motion.div>
      )}

      {/* Beat 23: Never Ends */}
      {beat === 22 && (
        <div className="flex flex-col items-center gap-12">
          <div className="text-4xl font-mono">Because when two immortals fight…</div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-8xl font-black text-crimson"
          >
            THE BATTLE NEVER ENDS.
          </motion.div>
        </div>
      )}

      {/* Beat 24: Blend */}
      {beat === 23 && (
        <div className="relative w-full h-[400px] flex items-center justify-center">
           <motion.div initial={{ x: -200 }} animate={{ x: 100 }} className="text-7xl font-black text-adamantium mix-blend-screen">DIFFERENT CODES</motion.div>
           <motion.div initial={{ x: 200 }} animate={{ x: -100 }} className="text-7xl font-black text-crimson mix-blend-screen">SAME CURSE</motion.div>
        </div>
      )}

      {/* Beat 25: Closing */}
      {beat === 24 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 10 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="text-9xl font-black text-crimson">IMMORTAL CLASH</div>
          <div className="text-xl font-mono tracking-[2em] opacity-30 mt-8">A KINETIC TYPOGRAPHY BLUEPRINT</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
