/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy all /api/*, /images/*, /audios/* requests to the ASP.NET Core backend.
   * This eliminates CORS issues and HTTP/HTTPS mismatches in development.
   *
   * Server-side env var (no NEXT_PUBLIC_ prefix):
   *   API_URL=http://localhost:5175   (in .env.local)
   */
  async rewrites() {
    const dest = (process.env.API_URL ?? "http://localhost:5175").replace(/\/$/, "");
    return [
      // ASP.NET API endpoints
      {
        source: "/api/:path*",
        destination: `${dest}/api/:path*`,
      },
      // Static media files served by the API (images, audio uploads)
      {
        source: "/images/:path*",
        destination: `${dest}/images/:path*`,
      },
      {
        source: "/audios/:path*",
        destination: `${dest}/audios/:path*`,
      },
    ];
  },
};

export default nextConfig;
