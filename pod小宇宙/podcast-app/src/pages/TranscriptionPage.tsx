import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Share2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../stores/audioStore';
import AudioPlayer from '../components/AudioPlayer';
import WaveformVisualizer from '../components/WaveformVisualizer';
import TranscriptHighlight from '../components/TranscriptHighlight';
import { exportTranscript } from '../utils/api';

export default function TranscriptionPage() {
  const navigate = useNavigate();
  const { currentAudio, transcription } = useAudioStore();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Check if data is valid after page refresh
  useEffect(() => {
    if (!currentAudio || !transcription) {
      navigate('/');
      return;
    }

    // Check if File object is still valid (it's lost on page refresh)
    if (!(currentAudio.url instanceof File)) {
      navigate('/');
      return;
    }
  }, [currentAudio, transcription, navigate]);

  if (!currentAudio || !transcription) {
    return null;
  }

  const handleExport = (format: 'txt' | 'json' | 'srt') => {
    exportTranscript(transcription, format);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>

          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-100">{currentAudio.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(transcription.duration / 60)}:{(transcription.duration % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport('txt')}
              className="px-4 py-2 bg-dark-card hover:bg-dark-surface rounded-lg text-sm text-gray-300 border border-dark-border transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm text-white transition-all flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </button>
          </div>
        </motion.div>

        {/* Audio Player & Waveform */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <AudioPlayer
            audioUrl={currentAudio.url}
            onTimeUpdate={setCurrentTime}
            onPlayStateChange={setIsPlaying}
          />
          <div className="mt-4">
            <WaveformVisualizer
              audioUrl={currentAudio.url}
              currentTime={currentTime}
            />
          </div>
        </motion.div>

        {/* Transcription Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Main Transcript */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-3">
                <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full" />
                逐字稿
              </h2>

              <TranscriptHighlight
                segments={transcription.segments}
                currentTime={currentTime}
                onWordClick={(wordIndex) => setCurrentWordIndex(wordIndex)}
              />

              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-dark-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {transcription.wordCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">字数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {transcription.segments.length}
                  </div>
                  <div className="text-sm text-gray-500">片段</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {new Set(transcription.segments.map(s => s.speaker)).size}
                  </div>
                  <div className="text-sm text-gray-500">说话人</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Info & Export */}
          <div className="space-y-4">
            {/* Export Options */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-100 mb-4">导出选项</h3>
              <div className="space-y-2">
                {[
                  { format: 'txt', label: '纯文本', icon: '📄' },
                  { format: 'json', label: 'JSON', icon: '{ }' },
                  { format: 'srt', label: 'SRT字幕', icon: '🎬' },
                ].map((option) => (
                  <button
                    key={option.format}
                    onClick={() => handleExport(option.format as any)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-dark-card hover:bg-dark-surface rounded-lg text-left transition-all group"
                  >
                    <span className="text-xl">{option.icon}</span>
                    <span className="flex-1 text-gray-300 group-hover:text-white">{option.label}</span>
                    <Download className="w-4 h-4 text-gray-500 group-hover:text-primary-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Speakers Legend */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-100 mb-4">说话人</h3>
              <div className="space-y-3">
                {Array.from(new Set(transcription.segments.map(s => s.speaker))).map((speaker, index) => (
                  <div
                    key={speaker}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      speaker === 'SPEAKER_00' ? 'bg-accent-500/10 text-accent-400' : 'bg-primary-500/10 text-primary-400'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      speaker === 'SPEAKER_00' ? 'bg-accent-500' : 'bg-primary-500'
                    }`} />
                    <span className="font-medium">{speaker === 'SPEAKER_00' ? '嘉宾A' : '嘉宾B'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-100 mb-4">使用提示</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>💡 点击任意单词可跳转到该位置</p>
                <p>⌨️ 使用空格键播放/暂停</p>
                <p>🎧 支持键盘快捷键</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
