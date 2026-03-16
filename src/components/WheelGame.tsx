import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, History as HistoryIcon, BarChart3, Coins } from 'lucide-react';
import { GameColor, COLOR_MAP } from '../types';

const WHEEL_DISTRIBUTION: { color: GameColor; count: number }[] = [
  { color: 'yellow', count: 1 },
  { color: 'green', count: 10 },
  { color: 'red', count: 17 },
  { color: 'blue', count: 26 },
];

const TOTAL_SEGMENTS = 54;

// Create the actual segments array
const SEGMENTS: GameColor[] = [];
WHEEL_DISTRIBUTION.forEach(({ color, count }) => {
  for (let i = 0; i < count; i++) {
    SEGMENTS.push(color);
  }
});

// Shuffle segments but keep them deterministic for the component lifecycle
const SHUFFLED_SEGMENTS = [...SEGMENTS].sort((a, b) => {
  // Simple deterministic shuffle based on color names to avoid random jumps on re-render
  return (a.length + a.charCodeAt(0)) - (b.length + b.charCodeAt(0)) + (Math.random() - 0.5);
});

export const WheelGame: React.FC = () => {
  const [phase, setPhase] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timer, setTimer] = useState(7);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<GameColor[]>([]);
  const [lastResult, setLastResult] = useState<GameColor | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [balance, setBalance] = useState(1000);

  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRotationRef = useRef(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'betting') {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            startSpin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const startSpin = () => {
    setPhase('spinning');
    const resultIndex = Math.floor(Math.random() * SHUFFLED_SEGMENTS.length);
    const resultColor = SHUFFLED_SEGMENTS[resultIndex];
    
    const segmentAngle = 360 / TOTAL_SEGMENTS;
    // We want the target segment to be at the top (270 degrees in SVG coordinate system usually, 
    // but we'll adjust based on our pointer position)
    // Our pointer is at the top (0 degrees).
    // The wheel rotates clockwise.
    // To get segment i to the top, we need to rotate by -(i * segmentAngle)
    // Plus some random offset within the segment
    const randomOffset = (Math.random() * 0.8 - 0.4) * segmentAngle;
    const targetRotation = 360 * 8 - (resultIndex * segmentAngle) + randomOffset;
    
    const finalRotation = currentRotationRef.current + targetRotation;
    setRotation(finalRotation);
    currentRotationRef.current = finalRotation;
    setLastResult(resultColor);

    spinTimeoutRef.current = setTimeout(() => {
      setPhase('result');
      setHistory(prev => [resultColor, ...prev].slice(0, 50));
      
      // Update balance if they "won" (simulated)
      // This is just for flavor
      
      setTimeout(() => {
        setPhase('betting');
        setTimer(7);
      }, 4000);
    }, 5000);
  };

  const stats = useMemo(() => {
    const counts = history.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const total = history.length || 1;
    return {
      blue: Math.round((counts.blue || 0) / total * 100),
      red: Math.round((counts.red || 0) / total * 100),
      green: Math.round((counts.green || 0) / total * 100),
      yellow: Math.round((counts.yellow || 0) / total * 100),
    };
  }, [history]);

  return (
    <div className="w-full max-w-5xl mx-auto bg-[#0c0d10] rounded-[2rem] overflow-hidden border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col h-[700px]">
      {/* Top Bar: History */}
      <div className="h-16 bg-black/40 border-b border-white/5 flex items-center px-6 gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-zinc-500 mr-4 shrink-0">
          <HistoryIcon size={14} />
          <span className="text-[10px] font-mono uppercase tracking-widest">History</span>
        </div>
        <div className="flex gap-2">
          <AnimatePresence initial={false}>
            {history.map((c, i) => (
              <motion.div 
                key={`${i}-${c}`}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 32, opacity: 1 }}
                className="h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                style={{ backgroundColor: `${COLOR_MAP[c].hex}20`, color: COLOR_MAP[c].hex, border: `1px solid ${COLOR_MAP[c].hex}40` }}
              >
                {COLOR_MAP[c].label}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Betting & Balance (SWAPPED) */}
        <div className="w-full md:w-80 border-r border-white/5 p-8 flex flex-col gap-8 bg-black/20 order-2 md:order-1">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <Coins size={14} />
                <span className="text-[10px] font-mono uppercase tracking-widest">Balance</span>
              </div>
              <span className="text-sm font-bold text-emerald-500">{balance.toLocaleString()} RF</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-3/4 opacity-50" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Place Your Bet</div>
            <div className="grid grid-cols-2 gap-3">
              {['blue', 'red', 'green', 'yellow'].map((color) => (
                <button 
                  key={color}
                  disabled={phase !== 'betting'}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 group ${
                    phase === 'betting' 
                      ? 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10' 
                      : 'bg-zinc-900/40 border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLOR_MAP[color as GameColor].hex }} />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black uppercase text-white">{COLOR_MAP[color as GameColor].label}</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Bet</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mt-auto">
            <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-4">
              <button onClick={() => setBetAmount(Math.max(10, betAmount - 10))} className="text-zinc-500 hover:text-white transition-colors px-2">-</button>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-mono text-zinc-600 uppercase">Amount</span>
                <span className="text-lg font-bold tracking-tighter">{betAmount}</span>
              </div>
              <button onClick={() => setBetAmount(betAmount + 10)} className="text-zinc-500 hover:text-white transition-colors px-2">+</button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 'MAX'].map((val) => (
                <button 
                  key={val.toString()} 
                  onClick={() => typeof val === 'number' ? setBetAmount(val) : setBetAmount(balance)}
                  className="py-2 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold hover:bg-white/10 transition-colors uppercase"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: The Wheel */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-12 bg-gradient-to-b from-zinc-900/10 to-transparent overflow-hidden order-1 md:order-2">
          {/* Pointer */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-20">
            <motion.div 
              animate={phase === 'spinning' ? { rotate: [0, -5, 5, -5, 0] } : { rotate: 0 }}
              transition={{ repeat: Infinity, duration: 0.1 }}
              className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
          </div>

          {/* The Wheel Container */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px]">
            <motion.div 
              className="w-full h-full rounded-full relative shadow-[0_0_100px_rgba(0,0,0,0.8)]"
              animate={{ rotate: rotation }}
              transition={phase === 'spinning' ? { duration: 5, ease: [0.32, 0, 0.07, 1] } : { duration: 0 }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {SHUFFLED_SEGMENTS.map((color, i) => {
                  const startAngle = (i * 360) / TOTAL_SEGMENTS;
                  const endAngle = ((i + 1) * 360) / TOTAL_SEGMENTS;
                  
                  // SVG arc calculation
                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                  
                  return (
                    <path
                      key={i}
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={COLOR_MAP[color].hex}
                      stroke="#000"
                      strokeWidth="0.2"
                      className="transition-colors duration-500"
                    />
                  );
                })}
                {/* Inner Ring */}
                <circle cx="50" cy="50" r="38" fill="#0c0d10" />
                <circle cx="50" cy="50" r="37" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              </svg>

              {/* Segment Labels (Optional, but adds detail) */}
              {SHUFFLED_SEGMENTS.map((color, i) => {
                const angle = (i * 360) / TOTAL_SEGMENTS + (360 / TOTAL_SEGMENTS / 2);
                if (color === 'yellow' || color === 'green') {
                  return (
                    <div 
                      key={`label-${i}`}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ transform: `rotate(${angle}deg) translateY(-42%)` }}
                    >
                      <span className="text-[8px] font-black text-white/40 rotate-90 inline-block">
                        {COLOR_MAP[color].label}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </motion.div>
            
            {/* Center Hub */}
            <div className="absolute inset-0 m-auto w-40 h-40 lg:w-48 lg:h-48 bg-[#0c0d10] rounded-full border-8 border-zinc-900 flex flex-col items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] z-10">
              <AnimatePresence mode="wait">
                {phase === 'betting' ? (
                  <motion.div 
                    key="timer"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-6xl font-black tracking-tighter text-white">{timer}</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Seconds Left</span>
                  </motion.div>
                ) : phase === 'spinning' ? (
                  <motion.div 
                    key="spinning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin" />
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Spinning</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-4xl font-black uppercase tracking-tighter" style={{ color: COLOR_MAP[lastResult!].hex }}>
                      {COLOR_MAP[lastResult!].label}
                    </div>
                    <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Winner</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel: Stats & Info (SWAPPED) */}
        <div className="w-full md:w-72 border-l border-white/5 p-8 flex flex-col gap-8 bg-black/20 order-3">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic text-white tracking-tighter">x50 WHEEL</h3>
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Calibration Environment</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <BarChart3 size={14} />
              <span className="text-[10px] font-mono uppercase tracking-widest">Live Stats</span>
            </div>
            {WHEEL_DISTRIBUTION.map(({ color }) => (
              <div key={color} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_MAP[color].hex }} />
                    <span className="text-[10px] font-bold uppercase text-zinc-300">{color}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{stats[color as keyof typeof stats]}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full" 
                    animate={{ width: `${stats[color as keyof typeof stats]}%` }}
                    style={{ backgroundColor: COLOR_MAP[color].hex }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
             <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <Zap size={14} />
                <span className="text-[10px] font-bold uppercase">System Status</span>
             </div>
             <p className="text-[9px] text-zinc-500 leading-relaxed">
                Wheel is operating with standard probability distribution. Use this to calibrate your camera detection thresholds.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
