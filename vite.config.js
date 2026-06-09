import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 커스텀 도메인(2048.jbinx.kr)을 사용하므로 사이트가 도메인 루트에서 서빙된다.
// 따라서 base는 '/'로 둔다. (public/CNAME 파일로 커스텀 도메인을 고정한다.)
// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
})
