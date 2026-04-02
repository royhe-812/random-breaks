/** @type {import('next').NextConfig} */
// Force rebuild - v2
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
