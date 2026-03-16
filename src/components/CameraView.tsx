import React, { useRef, useEffect, useState } from 'react';
import { ROI, GameColor, LiveStatus } from '../types';
import { detectColor } from '../utils/colorDetection';
import { Camera, Settings, Maximize, Zap } from 'lucide-react';

interface CameraViewProps {
  onColorDetected: (color: GameColor) => void;
  onLiveUpdate: (status: LiveStatus) => void;
  roi: ROI;
  setRoi: (roi: ROI) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onColorDetected, onLiveUpdate, roi, setRoi }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastDetected, setLastDetected] = useState<GameColor>('none');
  const [detectionCount, setDetectionCount] = useState(0);
  const [rotation, setRotation] = useState(0);

  const toggleRotation = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            frameRate: { ideal: 60 }
          } 
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
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          // Robust Sampling: If ROI is full screen, we sample the central 30% 
          // to avoid background noise while still "detecting whole screen"
          let sampleX = (roi.x / 100) * canvas.width;
          let sampleY = (roi.y / 100) * canvas.height;
          let sampleW = (roi.width / 100) * canvas.width;
          let sampleH = (roi.height / 100) * canvas.height;

          if (roi.width === 100 && roi.height === 100) {
            sampleX = canvas.width * 0.25;
            sampleY = canvas.height * 0.25;
            sampleW = canvas.width * 0.5;
            sampleH = canvas.height * 0.5;
          }

          if (sampleW > 0 && sampleH > 0) {
            const imageData = ctx.getImageData(sampleX, sampleY, sampleW, sampleH);
            const data = imageData.data;
            
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel for speed
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
            const count = data.length / 40;
            const avgR = r / count;
            const avgG = g / count;
            const avgB = b / count;

            const detected = detectColor(avgR, avgG, avgB);
            
            // Draw a small preview of what's being sampled in the corner of the video
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(sampleX, sampleY, sampleW, sampleH);
            
            // Emit Live Update
            onLiveUpdate({
              currentColor: detected,
              confidence: Math.min(100, (detectionCount / 5) * 100),
              isStable: detectionCount >= 5
            });

            // Debouncing for confirmed result
            if (detected !== 'none' && detected === lastDetected) {
              if (detectionCount >= 5) {
                onColorDetected(detected);
                setDetectionCount(0);
                setLastDetected('none');
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
    }, 100); // Faster updates (10fps)

    return () => clearInterval(interval);
  }, [isStreaming, roi, lastDetected, detectionCount, onColorDetected, onLiveUpdate]);

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
        className="w-full h-full object-cover transition-transform duration-500"
        style={{ transform: `rotate(${rotation}deg)` }}
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
        {roi.width === 100 && roi.height === 100 ? (
          <div className="absolute inset-[25%] border border-dashed border-emerald-500/40 flex items-center justify-center">
            <div className="text-[8px] font-mono text-emerald-500/40 uppercase tracking-widest">Sampling Center</div>
          </div>
        ) : (
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
          onClick={toggleRotation}
          className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 hover:bg-white/10 transition-colors"
         >
            <Settings size={10} className="text-zinc-400" />
            <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">Rotate</span>
         </button>

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
