import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 plugins:[react()],
 base:'/Robotics-Lab-3D/',
 build:{target:'es2022',rollupOptions:{output:{manualChunks:{three:['three'],react:['react','react-dom','zustand']}}}},
});
