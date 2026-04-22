import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carwash.app',
  appName: 'car-washing-expense',
  webDir: 'out',
  server: {
    url: 'https://car-wash-expense.vercel.app',
    cleartext: true,
  },
};

export default config;
