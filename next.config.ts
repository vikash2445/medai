import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  
  // ✅ Prevent static prerendering for dynamic routes
  output: 'standalone',
  
  // ✅ Allow dynamic routes to be rendered at request time
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ✅ Configure which routes should not be statically prerendered
  // This tells Next.js to treat these as dynamic routes
  staticPageGenerationTimeout: 120,
};

export default withPWA(nextConfig);