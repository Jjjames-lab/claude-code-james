import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import TranscriptionPage from './pages/TranscriptionPage';
import { useAudioStore } from './stores/audioStore';
import BackgroundLayers from './components/BackgroundLayers';

/**
 * 「回声 Echo」V3.0 - 主应用组件
 * Dark Poeticism Design
 */
function App() {
  const { currentAudio } = useAudioStore();

  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden">
        {/* V3.0 - 7层背景系统 */}
        <BackgroundLayers />

        {/* 主内容区域 */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/transcription" element={
                currentAudio ? <TranscriptionPage /> : <Navigate to="/" />
              } />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </Router>
  );
}

export default App;
