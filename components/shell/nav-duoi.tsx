'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  Home,
  Plus,
  Receipt,
  ShoppingBasket,
  Users,
} from 'lucide-react';
import { phatThem } from '@/lib/hanh-dong';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', nhan: 'Hôm nay', Icon: Home },
  { href: '/cho', nhan: 'Chợ', Icon: ShoppingBasket },
  { href: '/menu', nhan: 'Menu', Icon: CalendarDays },
  { href: '/ban', nhan: 'Bán', Icon: Receipt },
  { href: '/khach', nhan: 'Khách', Icon: Users },
  { href: '/so-sach', nhan: 'Sổ sách', Icon: BookOpen },
];

/**
 * Nút + đổi việc theo tab đang mở — mỗi màn có một thứ để "thêm" khác nhau.
 * `dich` = điều hướng sang màn khác. Không có `dich` = phát tín hiệu để chính
 * màn đang mở tự xử (xem lib/hanh-dong.ts).
 * null = màn đó không có việc thêm nào → ẩn hẳn, không bịa ra một nút chết.
 */
const NUT_THEM: Record<string, { nhan: string; moTa: string; dich?: string } | null> = {
  '/': { nhan: 'Đơn', moTa: 'Tạo đơn mới', dich: '/ban' },
  '/cho': { nhan: 'Dòng', moTa: 'Ghi thêm dòng chợ' },
  '/menu': { nhan: 'Món', moTa: 'Nhập món mới' },
  '/ban': null, // chính nó đã là màn thêm đơn
  '/khach': { nhan: 'Khách', moTa: 'Thêm khách hàng' },
  '/so-sach': null, // màn đọc báo cáo, thêm chi phí đã có form sẵn trong tab
};

export function NavDuoi() {
  const path = usePathname();
  const router = useRouter();
  const chuan = path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;
  const nut = NUT_THEM[chuan];

  return (
    <>
      {nut && (
        <button
          type="button"
          onClick={() => (nut.dich ? router.push(nut.dich) : phatThem())}
          aria-label={nut.moTa}
          className={cn(
            'fixed bottom-[76px] right-4 z-40 flex h-14 items-center gap-1.5 rounded-full px-5',
            'font-bold text-white shadow-lg nen-mua transition-transform active:scale-95',
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
          {nut.nhan}
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border kinh pb-safe">
        <div className="mx-auto grid max-w-app grid-cols-6">
          {TABS.map(({ href, nhan, Icon }) => {
            const active = chuan === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-nav flex-col items-center justify-center gap-1 text-[0.62rem] font-semibold transition-transform active:scale-95',
                  active ? 'chu-mua' : 'text-text-3',
                )}
              >
                <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.5 : 2} />
                {nhan}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
