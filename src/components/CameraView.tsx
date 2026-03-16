import React, { useRef, useEffect, useState } from 'react';
import { ROI, GameColor } from '../types';
import { detectColor } from '../utils/colorDetection';
import { Camera, Settings, Maximize } from 'lucide-react';

interface CameraViewProps {
  onColorDetected: (color: GameColor) => void;
  roi: ROI;
  setRoi: (roi: ROI) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onColorDetected, roi, setRoi }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastDetected, setLastDetected] = useState<GameColor>('none');
  const [detectionCount, setDetectionCount] = useState(0);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    setupCamera();
  }, []);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          // Draw current frame to hidden canvas for processing
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          // Map ROI percentages to actual pixel coordinates
          const x = (roi.x / 100) * canvas.width;
          const y = (roi.y / 100) * canvas.height;
          const w = (roi.width / 100) * canvas.width;
          const h = (roi.height / 100) * canvas.height;

          if (w > 0 && h > 0) {
            const imageData = ctx.getImageData(x, y, w, h);
            const data = imageData.data;
            
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
            const count = data.length / 4;
            const avgR = r / count;
            const avgG = g / count;
            const avgB = b / count;

            const detected = detectColor(avgR, avgG, avgB);
            
            // Debouncing: Only trigger if the same color is detected for multiple frames
            if (detected !== 'none' && detected === lastDetected) {
              if (detectionCount >= 5) { // Threshold for stable detection
                onColorDetected(detected);
                setDetectionCount(0);
                setLastDetected('none'); // Reset to avoid double trigger
              } else {
                setDetectionCount(prev => prev + 1);
              }
            } else {
              setLastDetected(detected);
              setDetectionCount(0);
            }
          }
        }
      }
    }, 200); // 5 times per second

    return () => clearInterval(interval);
  }, [isStreaming, roi, lastDetected, detectionCount, onColorDetected]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Simple ROI adjustment logic could be added here
    // For now, we'll assume the user can drag the ROI box
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
          <Camera size={48} className="mb-4 animate-pulse" />
          <p className="text-sm font-mono uppercase tracking-widest">Initializing Feed...</p>
        </div>
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* ROI Overlay */}
      <div 
        className={`absolute border-2 transition-all duration-300 ${
          roi.width === 100 && roi.height === 100 
            ? 'border-emerald-500/20 pointer-events-none' 
            : 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-move'
        }`}
        style={{
          left: `${roi.x}%`,
          top: `${roi.y}%`,
          width: `${roi.width}%`,
          height: `${roi.height}%`,
        }}
        onMouseDown={handleMouseDown}
      >
        {!(roi.width === 100 && roi.height === 100) && (
          <>
            <div className="absolute -top-6 left-0 bg-emerald-500 text-black text-[10px] font-bold px-1 uppercase">
              Detection Zone
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 cursor-nwse-resize" />
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2">
         <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">Live Feed</span>
         </div>
         
         <button 
          onClick={() => setRoi(roi.width === 100 ? { x: 40, y: 40, width: 20, height: 20 } : { x: 0, y: 0, width: 100, height: 100 })}
          className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 hover:bg-white/10 transition-colors"
         >
            <Maximize size={10} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">
              {roi.width === 100 ? 'Use ROI' : 'Full Screen'}
            </span>
         </button>
      </div>
    </div>
  );
};
