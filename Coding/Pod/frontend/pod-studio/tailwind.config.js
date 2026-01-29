/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media', // 跟随系统
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151e2e', // 自定义暗色背景
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '15': ['15px', { lineHeight: '1.6' }],
      }
    }
  },
  plugins: [],
}
