import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // 自定义环境变量前缀：不启用 VITE_（Vercel 视为安全隐患），
  // 仅将 SUPABASE_ 开头的变量暴露给客户端代码
  envPrefix: ['SUPABASE_'],
  // 兼容旧版 Safari：Vite 8 默认 target 是 safari16.4（Baseline 2025-05），
  // 旧 iPhone（iOS 15.x / 16.0-16.3）会因 class static block 等语法直接白屏。
  // 降到 safari15.4（= iOS 15.4，覆盖所有仍可安装 iOS 15 的机型）。
  // 注意：Vite 8 用 Oxc + Rolldown，build.target 只作用于生产构建；
  // dev 模式必须分别设置源码转换（oxc）和依赖预构建（optimizeDeps）的 target，
  // 否则依赖产物（如 radix-ui 的 class static block）仍会让旧 iPhone 白屏。
  oxc: {
    target: ['es2021', 'safari15.4'],
  },
  optimizeDeps: {
    rolldownOptions: {
      transform: {
        target: ['es2021', 'safari15.4'],
      },
    },
  },
  // iOS 15.x 的 Safari 只支持 lab()，不支持 oklch()/oklab()（真机 CSS.supports 实测为 false），
  // 而 Tailwind v4 整套调色盘（含默认色阶）都是 oklch，会导致所有颜色/背景/边框失效。
  // 用 Lightning CSS 按 Safari 15.0 降级，把 oklch/oklab 转换成 lab。
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        safari: 15 << 16,
        ios_saf: 15 << 16,
      },
    },
  },
  build: {
    target: ['safari15.4', 'ios15.4'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '家庭账本',
        short_name: '家庭账本',
        description: '家庭共享记账，多账本管理，收支一目了然',
        lang: 'zh-CN',
        theme_color: '#b88513',
        background_color: '#fbf9f4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // Ionic 核心体积较大，放宽单文件预缓存上限（默认 2 MiB）
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
