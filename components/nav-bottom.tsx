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

export function NavBottom() {
  const path = usePathname();
  const router = useRouter();
  const chuan = path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;

  return (
    <>
      {/* FAB "+ Đơn" — thao tác nhiều nhất trong ngày, nổi giữa, trên thanh nav */}
      <button
        type="button"
        onClick={() => router.push('/ban')}
        aria-label="Tạo đơn mới"
        className={cn(
          'fixed bottom-[72px] left-1/2 z-40 flex h-14 -translate-x-1/2 items-center gap-1.5 rounded-full',
          'bg-primary px-5 font-bold text-primary-foreground shadow-lg shadow-primary/30',
          'transition-transform active:scale-95',
          chuan === '/ban' && 'ring-4 ring-primary/25',
        )}
      >
        <Plus className="h-5 w-5" strokeWidth={3} />
        Đơn
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background pb-safe">
        {TABS.map(({ href, nhan, Icon }) => {
          const active = chuan === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
              {nhan}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
