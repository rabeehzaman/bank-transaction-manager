import type { NextConfig } from "next";

// PWA configuration will be added when next-pwa is installed
const withPWA = (config: NextConfig) => {
  // When next-pwa is available, wrap the config
  try {
    const nextPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, // 24 hours
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        {
          urlPattern: /\/_next\/static\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'next-static',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
      ],
    });
    return nextPWA(config);
  } catch (e) {
    console.log('next-pwa not installed, running without PWA support');
    return config;
  }
};

const nextConfig: NextConfig = {
  output: 'standalone',

  // Environment variables that should be available at runtime
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Handle build-time environment checks
  async generateBuildId() {
    return 'bank-transaction-manager'
  }
};

export default withPWA(nextConfig);
