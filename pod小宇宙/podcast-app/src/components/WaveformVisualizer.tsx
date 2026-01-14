import { useEffect, useRef, useState } from 'react';

interface WaveformVisualizerProps {
  audioUrl: string | File;
  currentTime: number;
}

export default function WaveformVisualizer({ audioUrl, currentTime }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let audioUrlString = '';

    // 处理 File 对象或 URL 字符串
    if (audioUrl instanceof File) {
      audioUrlString = URL.createObjectURL(audioUrl);
    } else {
      audioUrlString = audioUrl;
    }

    // Load audio and generate waveform
    const audio = new Audio(audioUrlString);

    audio.addEventListener('loadedmetadata', async () => {
      // Store duration
      setDuration(audio.duration);

      try {
        // Create AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Fetch audio data
        const response = await fetch(audioUrlString);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Extract waveform data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200; // Number of bars
        const blockSize = Math.floor(channelData.length / samples);
        const waveform: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;

          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j]);
          }

          waveform.push(sum / blockSize);
        }

        // Normalize
        const max = Math.max(...waveform);
        setWaveformData(waveform.map(v => v / max));
      } catch (error) {
        console.error('Error loading waveform:', error);
        // Generate random waveform as fallback
        setWaveformData(
          Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.2)
        );
      }
    });

    return () => {
      // 释放 blob URL
      if (audioUrl instanceof File && audioUrlString) {
        URL.revokeObjectURL(audioUrlString);
      }
      // 关闭 AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    // Draw waveform
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // Retina support
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const barGap = 1;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * height * 0.8;
      const y = (height - barHeight) / 2;

      // Check if this bar is before current time
      const progress = (currentTime / duration) || 0;
      const isActive = index / waveformData.length <= progress;

      // Gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      if (isActive) {
        gradient.addColorStop(0, '#f97316');
        gradient.addColorStop(1, '#06b6d4');
      } else {
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth - barGap, barHeight, 2);
      ctx.fill();
    });
  }, [waveformData, currentTime]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 rounded-lg"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
