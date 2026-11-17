import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checkdin.partner',
  appName: 'Checkdin Partner',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  android: { allowMixedContent: false },
  plugins: {
    // use the phone's own network stack for API calls, so browser CORS rules don't apply
    CapacitorHttp: { enabled: true },
  },
};

export default config;
