const withNextIntl = require("next-intl/plugin")("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  output: "standalone",
  images: {
    domains: [],
  },
};

module.exports = withNextIntl(nextConfig);
