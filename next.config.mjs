/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server build for the Docker runner stage.
  output: 'standalone',
};

export default nextConfig;
