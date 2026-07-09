import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.diesw.monogatari',
  appName: '物語集',

  webDir: 'dist',

  server: {
    androidScheme: 'https',
    url: 'https://monogatari.diesw.tech',
    cleartext: false,
    allowNavigation: [
      "monogatari.diesw.tech",
      "github.com",
      "api.github.com",
      "accounts.google.com",
      "*.google.com",
      "*.googleusercontent.com"
    ]
  }
};

export default config;