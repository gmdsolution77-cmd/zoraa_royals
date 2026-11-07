/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  /** Hides bottom-left "N Issues" dev badge (localhost only; not shown in production). */
  devIndicators: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
