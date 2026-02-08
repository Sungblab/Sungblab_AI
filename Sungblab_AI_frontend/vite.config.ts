import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // 핵심 React 라이브러리
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI 컴포넌트 라이브러리
          'vendor-ui': [
            '@headlessui/react', 
            '@heroicons/react', 
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs'
          ],
          
          // 수학 및 차트 라이브러리
          'vendor-math': ['katex', 'react-katex', 'mathjs', 'chart.js', 'react-chartjs-2'],
          
          // 에디터 및 코드 관련
          'vendor-editor': ['monaco-editor', '@monaco-editor/react', 'prism-react-renderer'],
          
          // 유틸리티 라이브러리
          'vendor-utils': [
            'axios', 
            'date-fns', 
            'nanoid', 
            'clsx', 
            'tailwind-merge',
            'class-variance-authority'
          ],
          
          // 마크다운 및 텍스트 처리
          'vendor-markdown': [
            'react-markdown', 
            'remark-gfm', 
            'remark-math', 
            'rehype-katex'
          ],
          
          // 파일 처리 및 변환
          'vendor-file': [
            'html-to-image', 
            'js-beautify'
          ],
          
          // 큰 라이브러리들은 별도 청크
          'pyodide': ['pyodide'],
          'mermaid': ['mermaid']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
}) 