import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';


export default defineConfig(({ command, mode }) => {


  const env = loadEnv(mode, process.cwd(), '');

  if (env.COMPOSE_PROFILES === "https") {

    return {
    plugins: [react()],
      server: {
        https: {
          key: fs.readFileSync(path.resolve(__dirname, 'privkey.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, 'fullchain.pem')),
        },

        host: '0.0.0.0',
        port: 443
      },
      logLevel: 'info'
    }
  }

  else {

    return {
    plugins: [react()],
      server: {
        allowedHosts: [".fithubmp.xyz"],
        host: '0.0.0.0',
        port: 5173
      },
      logLevel: 'info'
    }
  }
})
