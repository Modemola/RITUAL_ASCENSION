/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ritual/domain"],
  async rewrites() {
    const apiBase = process.env.API_PROXY_URL || "http://localhost:4000";

    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
