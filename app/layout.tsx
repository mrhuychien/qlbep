import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { BepProvider } from '@/lib/bep-context';
import { Guard } from '@/components/guard';
import { Toaster } from '@/components/ui/toaster';

// Be Vietnam Pro — thiết kế riêng cho tiếng Việt, đủ dấu, không vỡ chữ "ặỡẽẵờụ"
const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam',
});

export const metadata: Metadata = {
  title: 'Sổ Bếp',
  description: 'Quản lý bếp ăn ship bán lẻ — đi chợ, thực đơn, đơn hàng, lãi lỗ',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Sổ Bếp' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#EA580C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body className="bg-stone-50 font-sans">
        <AuthProvider>
          <BepProvider>
            <Guard>{children}</Guard>
            <Toaster />
          </BepProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
