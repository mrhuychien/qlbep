/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Dev không cần service worker — tránh cache làm khổ lúc sửa code
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
  runtimeCaching: [
    {
      // Shell + asset tĩnh: cache trước, mạng sau → mở app offline vẫn thấy giao diện
      urlPattern: /^https?.*\.(?:js|css|woff2?|png|svg|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'so-bep-static' },
    },
    {
      // Dữ liệu Supabase: ưu tiên mạng, hết 4s thì lấy bản đã tải
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'so-bep-data',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
});

const nextConfig = {
  // App nằm sau đăng nhập, không cần SEO → static export, deploy Cloudflare Pages
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
