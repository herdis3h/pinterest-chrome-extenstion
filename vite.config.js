import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '' }, // Copies manifest.json to dist
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'service-worker.jsx'), // Background service worker
        'content': resolve(__dirname, 'content.js'), // Content script
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
      external: [
        'puppeteer', // Mark puppeteer as external
        'url',       // Exclude Node.js modules
        'http',
        'https',
      ],
    },
    outDir: 'dist',
    target: 'esnext', 
    emptyOutDir: true,
    esbuild: {
      jsxInject: `import JSZip from 'jszip'`, // Optional: if React JSX is used
      
    },     
  },
});
