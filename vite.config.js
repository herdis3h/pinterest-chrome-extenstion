import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import inject from '@rollup/plugin-inject';

export default defineConfig({
 
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '' },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      // plugins: [
      //   inject({
      //     JSZip: 'jszip',
      //     saveAs: ['file-saver', 'saveAs'],
      //   }),
      // ],
      input: {
        'service-worker': resolve(__dirname, 'service-worker.jsx'),
        'content': resolve(__dirname, 'content.jsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    target: 'esnext',
    emptyOutDir: true,
    esbuild: {
      jsxInject: `
        import JSZip from 'jszip';
        import { saveAs } from 'file-saver';
      `,
    },
  },
});
