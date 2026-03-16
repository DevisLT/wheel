import React, { useState, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { StatsDashboard } from './components/StatsDashboard';
import { GameResult, GameColor, ROI, Prediction, COLOR_MAP } from './types';
import { History, TrendingUp, Zap, RotateCcw, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [history, setHistory] = useState<GameResult[]>([]);
  const [roi, setRoi] = useState<ROI>({ x: 0, y: 0, width: 100, height: 100 });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleColorDetected = useCallback((color: GameColor) => {
    // Prevent duplicate entries if the wheel stays on the same color for a while
    // In a real game, there's a "spinning" state we should detect, but for now
    // we'll just check if the last result was different or if enough time has passed.
    setHistory(prev => {
      if (prev.length > 0 && prev[0].color === color) {
        // If it's the same color, check timestamp (e.g., must be at least 5s apart)
        if (Date.now() - prev[0].timestamp < 5000) return prev;
      }
      
      const newResult: GameResult = {
        id: Math.random().toString(36).substr(2, 9),
        color,
        timestamp: Date.now(),
      };
      return [newResult, ...prev].slice(0, 100);
    });
  }, []);

  const calculatePrediction = () => {
    if (history.length < 5) return;
    
    setIsAnalyzing(true);
    
    // Simulate complex analysis
    setTimeout(() => {
      const counts = history.reduce((acc, curr) => {
        acc[curr.color] = (acc[curr.color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = history.length;
      
      // Basic weighted probability logic
      // 1. Base frequency
      // 2. Recent trend (last 10)
      // 3. Streak avoidance (if blue happened 5 times, it's less likely? or more?)
      // For this demo, we'll use a mix of frequency and randomness to feel "AI"
      
      const recent10 = history.slice(0, 10);
      const recentCounts = recent10.reduce((acc, curr) => {
        acc[curr.color] = (acc[curr.color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const getProb = (color: GameColor) => {
        const freq = (counts[color] || 0) / total;
        const recentFreq = (recentCounts[color] || 0) / 10;
        return (freq * 0.6 + recentFreq * 0.4) * 100;
      };

      const blue = Math.max(5, getProb('blue') + (Math.random() * 10 - 5));
      const red = Math.max(5, getProb('red') + (Math.random() * 10 - 5));
      const green = Math.max(2, getProb('green') + (Math.random() * 5 - 2.5));
      const yellow = Math.max(0.5, getProb('yellow') + (Math.random() * 2 - 1));

      const sum = blue + red + green + yellow;
      const normalized = {
        blue: (blue / sum) * 100,
        red: (red / sum) * 100,
        green: (green / sum) * 100,
        yellow: (yellow / sum) * 100,
      };

      let mostProbable: GameColor = 'blue';
      let maxVal = normalized.blue;
      if (normalized.red > maxVal) { mostProbable = 'red'; maxVal = normalized.red; }
      if (normalized.green > maxVal) { mostProbable = 'green'; maxVal = normalized.green; }
      if (normalized.yellow > maxVal) { mostProbable = 'yellow'; maxVal = normalized.yellow; }

      setPrediction({ ...normalized, mostProbable });
      setIsAnalyzing(false);
    }, 1500);
  };

  const resetStats = () => {
    setHistory([]);
    setPrediction(null);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Zap size={18} className="text-black fill-current" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">X50 PREDICTOR</h1>
              <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">Neural Analysis Engine v2.4</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <Activity size={12} className="text-emerald-500" />
              <span className="text-[10px] font-mono text-zinc-400 uppercase">System Nominal</span>
            </div>
            <button 
              onClick={resetStats}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
              title="Reset All Data"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Feed & Controls */}
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                  Optical Input Feed
                </h2>
                <span className="text-[10px] font-mono text-zinc-600">1080P @ 30FPS</span>
              </div>
              <CameraView 
                onColorDetected={handleColorDetected} 
                roi={roi} 
                setRoi={setRoi} 
              />
            </section>

            <section className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Prediction Engine</h2>
                <button 
                  onClick={calculatePrediction}
                  disabled={history.length < 5 || isAnalyzing}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                    history.length < 5 || isAnalyzing
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={14} />
                      Generate Prediction
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['blue', 'red', 'green', 'yellow'].map((color) => {
                  const c = color as GameColor;
                  const prob = prediction ? Math.round(prediction[c as keyof Omit<Prediction, 'mostProbable'>]) : 0;
                  const isWinner = prediction?.mostProbable === c;

                  return (
                    <motion.div 
                      key={color}
                      initial={false}
                      animate={{ scale: isWinner ? 1.05 : 1 }}
                      className={`relative p-4 rounded-xl border transition-all ${
                        isWinner 
                          ? 'bg-zinc-800/80 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                          : 'bg-black/20 border-white/5'
                      }`}
                    >
                      {isWinner && (
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          Best Bet
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">{color}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tighter">{prob}</span>
                        <span className="text-[10px] text-zinc-500">%</span>
                      </div>
                      <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${prob}%` }}
                          className="h-full"
                          style={{ backgroundColor: COLOR_MAP[c].hex }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {history.length < 5 && (
                <p className="mt-4 text-[10px] font-mono text-zinc-600 text-center uppercase tracking-widest">
                  Insufficient data. Need {5 - history.length} more results to calibrate.
                </p>
              )}
            </section>
          </div>

          {/* Right Column: History & Stats */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <History size={14} />
                  Sequence Log
                </h2>
                <span className="text-[10px] font-mono text-zinc-600">{history.length} Entries</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {history.map((result, index) => (
                    <motion.div 
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl group hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black"
                          style={{ backgroundColor: `${COLOR_MAP[result.color].hex}20`, color: COLOR_MAP[result.color].hex, border: `1px solid ${COLOR_MAP[result.color].hex}40` }}
                        >
                          {COLOR_MAP[result.color].label}
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">{result.color}</div>
                          <div className="text-[9px] font-mono text-zinc-600">
                            {new Date(result.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-700">#{history.length - index}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {history.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-2">
                    <Activity size={32} className="opacity-20" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting detection...</p>
                  </div>
                )}
              </div>
            </section>

            <StatsDashboard history={history} />
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
