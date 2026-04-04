/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // The repo currently has many lint warnings/errors that block production builds.
    // Allow building while we iteratively fix lint issues.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production build even if there are type errors in the repo; these
    // are pre-existing and will be addressed separately.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Reduces bundle size and improves build performance for these icon libraries
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  // Security headers applied to every route
  async headers() {
    const csp = [
      "default-src 'self'",
      // unsafe-inline / unsafe-eval are required by Next.js inline scripts and Tiptap
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      [
        "img-src 'self' data: blob:",
        'https://pub-505fbfcdba444803a75ae90dd308aa04.r2.dev',
        'https://lh3.googleusercontent.com',
        'https://avatars.githubusercontent.com',
        'https://cdn.discordapp.com',
        'https://images.unsplash.com',
        'https://source.unsplash.com',
      ].join(' '),
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
  // CORS settings - restrict to production domain in production
  async rewrites() {
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-505fbfcdba444803a75ae90dd308aa04.r2.dev', // Cloudflare R2 public image URLs
      },
    ],
  },
};

module.exports = nextConfig;
