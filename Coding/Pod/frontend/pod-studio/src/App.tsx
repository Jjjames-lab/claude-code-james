import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InputPage } from './pages/InputPage';
import { PodcastDetailPage } from './pages/PodcastDetailPage';
import { EpisodeTabPage } from './pages/EpisodeTabPage';
import { ToastContainer } from './components/ui/ToastContainer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 输入页面（首页） */}
        <Route path="/" element={<InputPage />} />

        {/* 播客详情页 */}
        <Route path="/podcast/:id" element={<PodcastDetailPage />} />

        {/* 单集 Tab 功能页 */}
        <Route path="/episode/:id" element={<EpisodeTabPage />} />
      </Routes>

      {/* 全局 Toast 通知容器 */}
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
