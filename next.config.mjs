/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server build for the Docker runner stage.
  output: 'standalone',
  experimental: {
    // Rewrite the icon barrel into per-icon imports so the compiler only walks
    // the icons actually used (faster builds, smaller client bundles) instead of
    // the whole @phosphor-icons set.
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

export default nextConfig;
