/** @type {import('next').NextConfig} */
const nextConfig = {
  // Telegram Mini Apps require no trailing slashes
  trailingSlash: false,
  experimental: {
    // Tree-shakes framer-motion imports per-module instead of pulling in
    // the whole package — smaller client bundle, same API/behavior.
    optimizePackageImports: ['framer-motion'],
  },
};

module.exports = nextConfig;
