import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // ตอน dev ในเครื่อง: เรียก /api → ส่งต่อไป server ที่ localhost:3000 (ไม่ต้องยุ่ง CORS)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
