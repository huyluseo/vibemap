import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibemap.app',
  appName: 'VibeMap',
  webDir: 'out',
  server: {
    url: 'https://vibemap.cloud',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
