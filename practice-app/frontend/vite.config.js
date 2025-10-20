import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';


export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'privkey.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'fullchain.pem')),
    },

    host: '0.0.0.0',
    port: 443
  },
})
