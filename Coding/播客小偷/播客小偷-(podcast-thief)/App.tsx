import React, { useState } from 'react';
import { Search, Radio, Sparkles, FileAudio, AlertCircle, Hash } from 'lucide-react';
import { analyzePodcastLink } from './services/geminiService';
import { PodcastAnalysis, AppState } from './types';
import TranscriptView from './components/TranscriptView';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [analysis, setAnalysis] = useState<PodcastAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    
    try {
      setState(AppState.ANALYZING_LINK);
      // Simulate link parsing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setState(AppState.EXTRACTING_AUDIO);
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setState(AppState.TRANSCRIBING);
      const result = await analyzePodcastLink(url);
      
      setAnalysis(result);
      setState(AppState.COMPLETED);
    } catch (e) {
      console.error(e);
      setState(AppState.ERROR);
      setErrorMsg("无法获取内容或分析失败。请确保链接有效且公开可见。");
    }
  };

  const renderHero = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-20 rounded-full animate-pulse"></div>
        <Radio size={64} className="text-purple-400 relative z-10" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-6 tracking-tight">
        博客小偷
      </h1>
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 font-light">
        输入小宇宙链接，一键提取深度访谈内容。
        <br />
        <span className="text-sm opacity-60">
          全自动生成摘要、核心观点及完整对话重构。
        </span>
      </p>

      <div className="w-full max-w-2xl relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative flex items-center bg-[#0a0518] rounded-xl border border-white/10 p-2 shadow-2xl">
          <Search className="ml-4 text-gray-500" size={20} />
          <input 
            type="text"
            placeholder="粘贴小宇宙(XiaoYuZhou)单集链接..."
            className="w-full bg-transparent border-none focus:ring-0 text-white px-4 py-3 placeholder-gray-600"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button 
            onClick={handleAnalyze}
            disabled={state !== AppState.IDLE && state !== AppState.COMPLETED && state !== AppState.ERROR}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {state === AppState.IDLE || state === AppState.COMPLETED || state === AppState.ERROR ? '开始窃取' : '处理中...'}
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      {state !== AppState.IDLE && state !== AppState.COMPLETED && state !== AppState.ERROR && (
        <div className="mt-8 flex items-center gap-3 text-purple-300 animate-pulse">
          <Sparkles size={18} />
          <span className="text-sm font-mono uppercase tracking-wider">
            {state === AppState.ANALYZING_LINK && "解析链接结构..."}
            {state === AppState.EXTRACTING_AUDIO && "定位音频源..."}
            {state === AppState.TRANSCRIBING && "AI 正在收听并整理文稿..."}
          </span>
        </div>
      )}

      {state === AppState.ERROR && (
        <div className="mt-6 text-red-400 flex items-center gap-2 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/20">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (!analysis) return null;

    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-12 animate-fade-in">
        
        {/* Header Section */}
        <div className="mb-10">
          <button 
            onClick={() => { setState(AppState.IDLE); setAnalysis(null); setUrl(''); }}
            className="text-gray-500 hover:text-white mb-6 transition-colors text-sm flex items-center gap-2"
          >
            ← 分析其他单集
          </button>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            {analysis.title}
          </h2>

          {/* Keywords as Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {analysis.keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium flex items-center gap-1">
                <Hash size={12} /> {kw.word}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                {analysis.summary}
              </p>
              
              {/* Audio Placeholder - Minimal */}
              <div className="bg-[#160d2e] rounded-xl p-4 flex items-center gap-4 border border-white/5">
                <div className="bg-purple-600/20 p-3 rounded-full text-purple-400">
                  <FileAudio size={20} />
                </div>
                <div className="flex-1">
                  <div className="h-1 bg-gray-800 rounded-full w-full mb-2 overflow-hidden">
                    <div className="h-full bg-purple-500 w-full animate-pulse"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>AI 已提取内容</span>
                    <span>Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Card */}
            <div className="glass-panel p-6 rounded-2xl h-fit">
              <h3 className="text-purple-300 uppercase text-xs font-bold tracking-widest mb-4">内容概览</h3>
              <ul className="space-y-4">
                {analysis.overview.map((point, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="text-purple-500 mt-[0.2em] font-bold">•</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Transcript Section - Full Width */}
        <div className="mt-12">
          <TranscriptView transcript={analysis.transcript} />
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030014] overflow-x-hidden selection:bg-purple-500 selection:text-white pb-20">
      
      {/* Navigation */}
      <nav className="w-full p-6 flex justify-between items-center z-50 relative">
        <div className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full"></div>
          Podcast Thief
        </div>
        <div className="text-xs font-mono text-gray-600">
          v1.0.2 // GEMINI-3-FLASH
        </div>
      </nav>

      {/* Main Content Switch */}
      {state === AppState.COMPLETED ? renderContent() : renderHero()}
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
      </div>

    </div>
  );
};

export default App;
