/** @type {import('next').NextConfig} */
// Bộ luật cache mặc định của next-pwa — trong đó có luật cho request điều hướng
// (HTML). Phải GIỮ, chỉ thêm luật riêng vào đầu; ghi đè cả mảng là mất khả năng
// mở app khi offline mà không báo lỗi gì.
const cacheMacDinh = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  // Tự đăng ký trong components/dang-ky-sw.tsx — xem ghi chú ở file đó
  register: false,
  skipWaiting: true,
  // Dev không cần service worker — tránh cache làm khổ lúc sửa code
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
  runtimeCaching: [
    {
      // Dữ liệu Supabase: ưu tiên mạng, hết 4s thì lấy bản đã tải về trước đó.
      // Đặt TRƯỚC bộ mặc định để thắng luật 'cross-origin' chung chung.
      urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/.*/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'so-bep-data',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    ...cacheMacDinh,
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
