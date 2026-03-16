import React, { useEffect, useState } from 'react';
import { LiveStatus, COLOR_MAP, GameColor } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LiveDetectionStreamProps {
  liveStatus: LiveStatus;
}

export const LiveDetectionStream: React.FC<LiveDetectionStreamProps> = ({ liveStatus }) => {
  const [stream, setStream] = useState<{ id: number; color: GameColor }[]>([]);

  useEffect(() => {
    if (liveStatus.currentColor !== 'none' && liveStatus.confidence > 30) {
      setStream(prev => {
        // Only add if it's different from the last one or enough time has passed
        const last = prev[0];
        if (last && last.color === liveStatus.currentColor) return prev;
        
        return [{ id: Date.now(), color: liveStatus.currentColor }, ...prev].slice(0, 20);
      });
    }
  }, [liveStatus]);

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">Live Optical Stream</h2>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500 uppercase">Real-time Feed</span>
        </div>
      </div>

      <div className="flex gap-2 h-12 items-center">
        <AnimatePresence initial={false}>
          {stream.map((item) => (
            <motion.div
              key={item.id}
              initial={{ width: 0, opacity: 0, x: -20 }}
              animate={{ width: 24, opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="h-8 rounded-md shrink-0 border border-white/10 shadow-lg"
              style={{ backgroundColor: COLOR_MAP[item.color].hex }}
              title={item.color}
            />
          ))}
        </AnimatePresence>
        {stream.length === 0 && (
          <div className="text-[10px] font-mono text-zinc-700 uppercase italic">Waiting for detection...</div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-[9px] font-mono text-zinc-600 uppercase">Raw Sensor Data</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-1 h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="w-full bg-emerald-500/30"
                animate={{ height: [`${20+Math.random()*60}%`, `${20+Math.random()*60}%`] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
