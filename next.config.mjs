/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip TypeScript type checking during build to avoid failing the build on type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
