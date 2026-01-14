import React, { useRef, useEffect } from 'react';
import { THEME } from '../constants';

interface WaveformProps {
  data: number[];
  progress: number; // 0 to 1
  onSeek: (progress: number) => void;
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({ data, progress, onSeek, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const barWidth = width / data.length;
      const gap = 1;
      const effectiveBarWidth = Math.max(1, barWidth - gap);

      data.forEach((value, index) => {
        const x = index * barWidth;
        const barHeight = Math.max(2, value * height * 0.8); // 80% max height
        const y = (height - barHeight) / 2;
        
        const isPlayed = index / data.length <= progress;

        // Gradient for played part
        if (isPlayed) {
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, '#f97316'); // Orange
          gradient.addColorStop(1, '#06b6d4'); // Cyan
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Unplayed gray
        }

        // Rounded caps manually or simple rect
        ctx.beginPath();
        ctx.roundRect(x, y, effectiveBarWidth, barHeight, 2);
        ctx.fill();
        
        // Active indicator line
        if (Math.abs((index / data.length) - progress) < 0.005) {
             ctx.shadowColor = '#f97316';
             ctx.shadowBlur = 10;
             ctx.fillStyle = '#fff';
             ctx.fillRect(x, 0, 2, height);
             ctx.shadowBlur = 0;
        }
      });
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [data, progress]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, x / rect.width));
    onSeek(newProgress);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative h-24 w-full cursor-pointer group ${className}`} 
      onClick={handleClick}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      {/* Hover Line */}
      <div className="absolute top-0 bottom-0 w-px bg-white/50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200" style={{ left: '0%' }} />
    </div>
  );
};
