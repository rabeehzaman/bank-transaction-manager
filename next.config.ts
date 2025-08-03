import type { NextConfig } from "next";

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

export default nextConfig;
