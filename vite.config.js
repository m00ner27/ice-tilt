import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: [
      'localhost',
      'icetiltangularapp.onrender.com',
      '37b7-98-209-45-34.ngrok-free.app' // Add your ngrok domain here
    ]
  }
});
