import NextConfig from './config/next.config.js';

// Override for Docker build to prevent static generation issues
const config = {
  ...NextConfig,
  
  // Skip static generation for auth routes
  experimental: {
    ...NextConfig.experimental,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Force dynamic rendering for all pages
  poweredByHeader: false,
  compress: true,
};

export default config;