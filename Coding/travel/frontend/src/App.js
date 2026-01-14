import React from 'react';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <ChatProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50">
        {/* 顶部标题栏 */}
        <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌍</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AI旅行顾问</h1>
              <p className="text-sm text-gray-500">来自宇宙的善意，为你规划地球之旅</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-gray-600">在线</span>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="flex-1 flex overflow-hidden">
          {/* 聊天窗口 */}
          <div className="flex-1 flex flex-col">
            <ChatWindow />
          </div>

          {/* 信息侧边栏 */}
          <aside className="w-80 bg-white shadow-lg">
            <Sidebar />
          </aside>
        </main>
      </div>
    </ChatProvider>
  );
}

export default App;
