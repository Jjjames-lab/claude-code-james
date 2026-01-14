import React from 'react';
import { TranscriptItem } from '../types';
import { User, Mic } from 'lucide-react';

interface TranscriptViewProps {
  transcript: TranscriptItem[];
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 h-[600px] overflow-y-auto flex flex-col gap-6">
      <h3 className="text-xl font-bold text-white mb-2 sticky top-0 bg-[#160d2e]/90 backdrop-blur-md py-2 z-10 border-b border-white/10">
        逐字稿 (Transcript)
      </h3>
      
      {transcript.map((item, index) => {
        const isHost = index % 2 === 0; // Simple heuristic for visual variety
        return (
          <div key={index} className={`flex gap-4 ${isHost ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isHost ? 'bg-indigo-600' : 'bg-fuchsia-600'}`}>
              {isHost ? <Mic size={18} className="text-white" /> : <User size={18} className="text-white" />}
            </div>
            
            <div className={`flex flex-col max-w-[80%] ${isHost ? 'items-start' : 'items-end'}`}>
              <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                <span className="font-bold text-gray-300">{item.speaker}</span>
                <span>{item.time}</span>
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                isHost 
                  ? 'bg-white/10 text-gray-100 rounded-tl-none' 
                  : 'bg-purple-500/20 text-gray-100 rounded-tr-none'
              }`}>
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TranscriptView;
