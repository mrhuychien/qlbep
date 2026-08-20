'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, CalendarDays, Home, Plus, ShoppingBasket, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', nhan: 'Hôm nay', Icon: Home },
  { href: '/cho', nhan: 'Chợ', Icon: ShoppingBasket },
  { href: '/menu', nhan: 'Menu', Icon: CalendarDays },
  { href: '/khach', nhan: 'Khách', Icon: Users },
  { href: '/so-sach', nhan: 'Sổ sách', Icon: BookOpen },
];

export function NavDuoi() {
  const path = usePathname();
  const router = useRouter();
  const chuan = path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;

  // Trên chính màn /ban, FAB vừa thừa vừa che mất nút "Lưu đơn" → ẩn hẳn
  const hienFab = chuan !== '/ban';

  return (
    <>
      {hienFab && (
        <button
          type="button"
          onClick={() => router.push('/ban')}
          aria-label="Tạo đơn mới"
          className={cn(
            'fixed bottom-[76px] left-1/2 z-40 flex h-14 -translate-x-1/2 items-center gap-1.5',
            'rounded-full px-5 font-bold text-white shadow-lg nen-mua transition-transform active:scale-95',
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
          Đơn
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border kinh pb-safe">
        <div className="mx-auto grid max-w-app grid-cols-5">
          {TABS.map(({ href, nhan, Icon }) => {
            const active = chuan === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-nav flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold transition-transform active:scale-95',
                  active ? 'chu-mua' : 'text-text-3',
                )}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                {nhan}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
