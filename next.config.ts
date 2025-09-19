/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["127.0.0.1", "localhost"],
  },
  i18n: {
    locales: ['uk'],
    defaultLocale: 'uk',
  },
};

export default nextConfig;
