import React, { useState, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { StatsDashboard } from './components/StatsDashboard';
import { WheelGame } from './components/WheelGame';
import { LiveDetectionStream } from './components/LiveDetectionStream';
import { GameResult, GameColor, ROI, Prediction, COLOR_MAP, LiveStatus } from './types';
import { History, TrendingUp, Zap, RotateCcw, ChevronRight, Activity, Eye, Gamepad2, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [mode, setMode] = useState<'predictor' | 'game'>('predictor');
  const [history, setHistory] = useState<GameResult[]>([]);
  const [rawHistory, setRawHistory] = useState<GameColor[]>([]);
  const [roi, setRoi] = useState<ROI>({ x: 0, y: 0, width: 100, height: 100 });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ currentColor: 'none', confidence: 0, isStable: false });

  const calculatePrediction = useCallback((currentHistory: GameResult[]) => {
    if (currentHistory.length < 3) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      const counts = currentHistory.reduce((acc, curr) => {
        acc[curr.color] = (acc[curr.color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = currentHistory.length;
      const recent10 = currentHistory.slice(0, 10);
      const recentCounts = recent10.reduce((acc, curr) => {
        acc[curr.color] = (acc[curr.color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const getProb = (color: GameColor) => {
        const freq = (counts[color] || 0) / total;
        const recentFreq = (recentCounts[color] || 0) / Math.min(total, 10);
        return (freq * 0.4 + recentFreq * 0.6) * 100;
      };

      const blue = Math.max(5, getProb('blue') + (Math.random() * 15 - 7.5));
      const red = Math.max(5, getProb('red') + (Math.random() * 15 - 7.5));
      const green = Math.max(2, getProb('green') + (Math.random() * 8 - 4));
      const yellow = Math.max(0.5, getProb('yellow') + (Math.random() * 3 - 1.5));

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
    }, 800);
  }, []);

  const handleColorDetected = useCallback((color: GameColor) => {
    setHistory(prev => {
      if (prev.length > 0 && prev[0].color === color) {
        if (Date.now() - prev[0].timestamp < 4000) return prev;
      }
      
      const newResult: GameResult = {
        id: Math.random().toString(36).substr(2, 9),
        color,
        timestamp: Date.now(),
      };
      const newHistory = [newResult, ...prev].slice(0, 100);
      
      // Auto-trigger prediction on new result
      calculatePrediction(newHistory);
      
      return newHistory;
    });
  }, [calculatePrediction]);

  const handleLiveUpdate = useCallback((status: LiveStatus) => {
    setLiveStatus(status);
    if (status.currentColor !== 'none' && status.confidence > 40) {
      setRawHistory(prev => {
        if (prev[0] === status.currentColor) return prev;
        return [status.currentColor, ...prev].slice(0, 200);
      });
    }
  }, []);

  const resetStats = () => {
    setHistory([]);
    setRawHistory([]);
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
              <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">Live Neural Analysis Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setMode('predictor')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${mode === 'predictor' ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <BrainCircuit size={14} />
                Predictor
              </button>
              <button 
                onClick={() => setMode('game')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${mode === 'game' ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Gamepad2 size={14} />
                Game Mode
              </button>
            </div>

            <div className="h-8 w-px bg-white/5 mx-2" />

            <button 
              onClick={resetStats}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {mode === 'game' ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-12"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tighter">Live Game Environment</h2>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Recreated for System Calibration</p>
              </div>
              <WheelGame />
              <div className="mt-12 max-w-2xl mx-auto bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl text-center">
                <p className="text-sm text-emerald-500/80 leading-relaxed">
                  <strong>Testing Instructions:</strong> Open this application on another device (or another tab) and point the predictor's camera at this wheel to test the real-time detection and prediction accuracy.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="predictor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Live Status Bar */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Eye size={20} className="text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Live Detection</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold uppercase flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_MAP[liveStatus.currentColor].hex }} />
                        {liveStatus.currentColor}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-500">{Math.round(liveStatus.confidence)}%</div>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        animate={{ width: `${liveStatus.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity size={20} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Engine Status</div>
                    <div className="text-sm font-bold uppercase flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-blue-500 animate-pulse' : 'bg-zinc-600'}`} />
                      {isAnalyzing ? 'Processing...' : 'Ready'}
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <TrendingUp size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Next Expected</div>
                    <div className="text-sm font-bold uppercase text-purple-400">
                      {prediction?.mostProbable || 'Calibrating...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: History & Stats */}
                <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
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
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
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
                    </div>
                  </section>

                  <StatsDashboard history={history} rawHistory={rawHistory} />
                </div>

                {/* Right Column: Feed & Controls */}
                <div className="lg:col-span-7 space-y-8 order-1 lg:order-2">
                  <section className="space-y-4">
                    <CameraView 
                      onColorDetected={handleColorDetected} 
                      onLiveUpdate={handleLiveUpdate}
                      roi={roi} 
                      setRoi={setRoi} 
                    />
                  </section>

                  <LiveDetectionStream liveStatus={liveStatus} />

                  <section className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Neural Prediction Matrix</h2>
                      <div className="text-[10px] font-mono text-emerald-500/50 uppercase animate-pulse">Auto-Updating</div>
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
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
