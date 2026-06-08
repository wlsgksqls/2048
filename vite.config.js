import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages는 https://<user>.github.io/testq/ 경로로 서빙되므로
// 프로덕션 빌드에서는 base를 저장소 이름으로 맞춘다.
// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/testq/' : '/',
  plugins: [react()],
}))
