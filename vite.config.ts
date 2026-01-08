
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // 將警告門檻從 500kB 調高到 1000kB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 將大型第三方套件拆分成獨立的檔案，減少主檔案大小
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor'; // 其他套件統一打包
          }
        },
      },
    },
  },
});
