import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/puresky-guild-pwa/',
  server: {
    allowedHosts: ['5173-irk49hpmtbvzj4s72gsoa-0c3d5419.sg1.manus.computer', 'localhost'],
  },
})
