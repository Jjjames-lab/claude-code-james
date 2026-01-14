import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { THEME } from './constants';
import { AppState, AudioMetadata, TranscriptionResult } from './types';
import { uploadAndTranscribe } from './services/glmService';
import { generateWaveformData, formatTime } from './utils/audioUtils';
import { Button } from './components/Button';
import { Waveform } from './components/Waveform';
import { TranscriptView } from './components/TranscriptView';

// Icon Components
const UploadIcon = () => (
  <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [audioMeta, setAudioMeta] = useState<AudioMetadata | null>(null);
  const [transcript, setTranscript] = useState<TranscriptionResult | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle File Drop
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Basic Validation
    if (!file.type.startsWith('audio/')) {
      alert("Please upload an audio file");
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    // Get Duration first
    audio.onloadedmetadata = async () => {
      setAudioMeta({
        name: file.name,
        size: file.size,
        duration: audio.duration,
        url: url,
        file: file
      });
      
      setState(AppState.UPLOADING);
      setErrorMessage("");
      
      try {
        // 1. Generate Waveform immediately for UX
        const waves = await generateWaveformData(url);
        setWaveformData(waves);

        // 2. Start Real Transcription
        const result = await uploadAndTranscribe(file, (pct) => setUploadProgress(pct), audio.duration);
        setTranscript(result);
        setState(AppState.READY);
      } catch (e: any) {
        console.error(e);
        setErrorMessage(e.message || "Unknown error occurred");
        setState(AppState.ERROR);
      }
    };
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'audio/*': [] },
    multiple: false
  });

  // Audio Control Logic
  useEffect(() => {
    if (audioMeta && !audioRef.current) {
      audioRef.current = new Audio(audioMeta.url);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setProgress(audioRef.current.currentTime / audioMeta.duration);
        }
      });
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
  }, [audioMeta]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (newProgress: number) => {
    if (!audioRef.current || !audioMeta) return;
    const newTime = newProgress * audioMeta.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(newProgress);
  };

  const handleJump = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleExport = (format: 'txt' | 'json' | 'srt' | 'md') => {
    if (!transcript) return;
    let content = '';
    const filename = `echo_transcript.${format}`;

    if (format === 'json') {
      content = JSON.stringify(transcript, null, 2);
    } else if (format === 'txt') {
      content = transcript.segments.map(s => `[${formatTime(s.start)}] ${s.speaker}: ${s.text}`).join('\n');
    } else if (format === 'md') {
       content = `# Transcript: ${audioMeta?.name}\n\n` + transcript.segments.map(s => `### **${s.speaker}** (${formatTime(s.start)})\n${s.text}\n`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // Render Views
  if (state === AppState.IDLE || state === AppState.UPLOADING || state === AppState.ERROR) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="z-10 text-center mb-12 animate-fade-in-up">
          <h1 className="text-6xl font-bold mb-4 tracking-tight">
            Echo <span className={THEME.gradients.text}>回声</span>
          </h1>
          <p className="text-xl text-gray-400 font-light">Make every listening resonate.</p>
        </div>

        <div 
          {...getRootProps()} 
          className={`
            w-full max-w-2xl h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group
            ${isDragActive ? 'border-cyan-500 bg-cyan-900/10' : 'border-white/10 bg-white/5 hover:border-orange-500/50'}
            ${state === AppState.UPLOADING ? 'pointer-events-none opacity-80' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {state === AppState.UPLOADING ? (
             <div className="flex flex-col items-center w-full px-12">
               <div className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-cyan-400">
                 Transcribing... {Math.round(uploadProgress)}%
               </div>
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all duration-300 ease-out"
                   style={{ width: `${uploadProgress}%` }}
                 />
               </div>
               <p className="mt-4 text-sm text-gray-500 animate-pulse">Sending data to Zhipu GLM...</p>
             </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <UploadIcon />
              <p className="text-xl font-medium text-gray-200 mb-2">Drag & Drop Podcast Audio</p>
              <p className="text-sm text-gray-500">Supports MP3, WAV, M4A (Max 4 Hours)</p>
              <div className="mt-6 px-4 py-2 bg-white/10 rounded-full text-xs font-mono text-gray-400 border border-white/5">
                Powered by GLM-4-Voice
              </div>
            </>
          )}
        </div>

        {state === AppState.ERROR && (
          <div className="mt-6 max-w-2xl w-full p-6 bg-red-950/30 border border-red-500/20 rounded-xl text-red-200 flex flex-col items-center gap-2">
            <h3 className="font-bold text-lg">Transcription Failed</h3>
            <p className="text-sm text-red-300/80 text-center">{errorMessage}</p>
            <p className="text-xs text-gray-500 mt-2">Note: Zhipu API may block browser requests (CORS). Try running this locally with a proxy.</p>
            <button onClick={() => setState(AppState.IDLE)} className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors">
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // READY STATE UI
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md flex items-center justify-between px-6 z-20 sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setState(AppState.IDLE)}>
          <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-cyan-500" />
          <span className="font-bold text-lg tracking-tight">Echo</span>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-1.5 border border-white/10 w-96">
          <span className="text-gray-500">🔍</span>
          <input 
            type="text" 
            placeholder="Search transcript..." 
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="glass" onClick={() => handleExport('md')} className="!py-1.5 !px-3 text-sm">Export MD</Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-xs font-bold">J</div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 h-[calc(100vh-64px)]">
        
        {/* Left Col: Visuals & Player */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
           
           {/* Card: Audio Info */}
           <div className="glass p-6 rounded-2xl flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
             <div className="z-10">
               <h2 className="text-2xl font-bold mb-1 truncate">{audioMeta?.name}</h2>
               <div className="flex gap-4 text-sm text-gray-400 font-mono">
                 <span>⏱ {formatTime(audioMeta?.duration || 0)}</span>
                 <span>💾 {(audioMeta?.size || 0 / 1024 / 1024).toFixed(1)} MB</span>
                 <span>👥 {new Set(transcript?.segments.map(s => s.speaker)).size} Speakers</span>
               </div>
             </div>
             
             {/* Waveform Visualization */}
             <div className="mt-6">
                <Waveform 
                  data={waveformData} 
                  progress={progress} 
                  onSeek={handleSeek} 
                />
             </div>

             {/* Play Controls */}
             <div className="flex items-center justify-center gap-6 mt-4">
                <button className="text-gray-400 hover:text-white" onClick={() => handleSeek(Math.max(0, progress - 0.05))}>⏮ 15s</button>
                <button 
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                >
                  {isPlaying ? '⏸' : '▶️'}
                </button>
                <button className="text-gray-400 hover:text-white" onClick={() => handleSeek(Math.min(1, progress + 0.05))}>⏭ 15s</button>
             </div>

             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
           </div>

           {/* Stats / Visuals Placeholder */}
           <div className="grid grid-cols-2 gap-6 flex-1">
             <div className="glass rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">Total Words</div>
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500">
                  {transcript?.words.length}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none"></div>
             </div>
             <div className="glass rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">Speaking Pace</div>
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                  {Math.round((transcript?.words.length || 0) / ((transcript?.duration || 1) / 60))} <span className="text-lg text-gray-500 font-normal">wpm</span>
                </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none"></div>
             </div>
           </div>
        </div>

        {/* Right Col: Transcript */}
        <div className="col-span-12 lg:col-span-5 h-full">
          {transcript && (
            <TranscriptView 
              data={transcript} 
              currentTime={currentTime} 
              onJump={handleJump}
              searchQuery={searchQuery}
            />
          )}
        </div>

      </main>
      
      {/* Global Styles for Glassmorphism */}
      <style>{`
        .glass {
          background: rgba(18, 18, 26, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
      `}</style>
    </div>
  );
};

export default App;