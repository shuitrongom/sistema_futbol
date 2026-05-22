/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce compilation time
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Reduce server-side bundle
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
