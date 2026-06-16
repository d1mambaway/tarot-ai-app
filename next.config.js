const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Telegram Mini Apps require no trailing slashes
  trailingSlash: false,
};

module.exports = withNextIntl(nextConfig);
