/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Provide an explicit empty `turbopack` config so Next.js doesn't error
  // when a custom `webpack` config is present. This silences the
  // "using Turbopack with a webpack config and no turbopack config" error.
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      dns: false,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
