import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TranscriptionResult, Segment, Word } from '../types';
import { THEME } from '../constants';

interface TranscriptViewProps {
  data: TranscriptionResult;
  currentTime: number;
  onJump: (time: number) => void;
  searchQuery: string;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ 
  data, 
  currentTime, 
  onJump, 
  searchQuery 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Optimization: Find active segment index efficiently
  const activeSegmentIndex = useMemo(() => {
    return data.segments.findIndex(s => currentTime >= s.start && currentTime <= s.end);
  }, [currentTime, data.segments]);

  useEffect(() => {
    if (autoScroll && activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSegmentIndex, autoScroll]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} className="bg-yellow-500/40 text-yellow-200 rounded px-0.5 shadow-[0_0_10px_rgba(234,179,8,0.3)]">{part}</span> : 
        part
    );
  };

  return (
    <div 
      className="h-full flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      style={{ height: 'calc(100vh - 180px)' }}
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 z-10">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">📝</span> Transcript
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-300 font-medium ${
                    autoScroll 
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                    : 'border-white/20 text-gray-400 hover:bg-white/5'
                }`}
            >
                {autoScroll ? '● Auto-scroll' : '○ Manual'}
            </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative"
      >
        {data.segments.length === 0 && (
            <div className="text-center text-gray-500 mt-20">No transcript generated.</div>
        )}

        {data.segments.map((segment, sIndex) => {
          const isActiveSegment = sIndex === activeSegmentIndex;
          
          return (
            <div 
              key={sIndex} 
              ref={isActiveSegment ? activeRef : null}
              className={`transition-all duration-500 border-l-2 pl-4 ${
                  isActiveSegment 
                  ? 'opacity-100 border-orange-500 bg-white/[0.02] -ml-4 pl-8 py-2 rounded-r-xl' 
                  : 'opacity-50 border-transparent hover:opacity-80'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {/* Single speaker icon style */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-white/10`}
                  style={{ 
                    background: 'linear-gradient(135deg, #f97316, #fb923c)' 
                  }}
                >
                  Host
                </div>
                <span className={`text-sm font-bold tracking-wide text-orange-400`}>
                   Speaker
                </span>
                <span className="text-xs text-gray-500 font-mono bg-black/30 px-2 py-0.5 rounded">
                  {new Date(segment.start * 1000).toISOString().substr(14, 5)}
                </span>
              </div>

              <p className="text-lg leading-relaxed text-gray-300 font-light">
                {segment.words.map((word, wIndex) => {
                  const isCurrentWord = currentTime >= word.start && currentTime <= word.end;
                  const isPastWord = currentTime > word.end;
                  
                  return (
                    <span 
                      key={wIndex}
                      onClick={() => onJump(word.start)}
                      className={`
                        inline-block cursor-pointer px-0.5 rounded-md transition-all duration-150
                        ${isCurrentWord 
                            ? 'bg-orange-500/20 text-orange-200 scale-110 font-medium shadow-[0_0_15px_rgba(249,115,22,0.2)] z-10 relative' 
                            : 'hover:text-white hover:bg-white/10'}
                        ${!isCurrentWord && isPastWord ? 'text-gray-400' : ''}
                      `}
                    >
                      {highlightText(word.text, searchQuery)}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
        
        {/* Padding at bottom for scroll comfort */}
        <div className="h-48" />
      </div>
    </div>
  );
};
