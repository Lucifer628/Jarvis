import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bf5.jarvisx',
  appName: 'JARVIS-X',
  webDir: 'www',
  server: {
    // GitHub Actions replaces this placeholder with your deployed HTTPS URL.
    url: 'https://YOUR-JARVIS-DOMAIN.example',
    cleartext: false
  }
};

export default config;
