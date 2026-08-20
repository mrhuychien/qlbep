'use client';

import { usePathname } from 'next/navigation';
import { RotateCw } from 'lucide-react';
import { phatTaiLai } from '@/lib/tai-lai';
import { ChonMua } from '@/components/shell/chon-mua';
import { TaiKhoan } from '@/components/tai-khoan';

const TIEU_DE: Record<string, string> = {
  '/': 'Hôm nay',
  '/cho': 'Ghi chợ',
  '/menu': 'Thực đơn',
  '/ban': 'Đơn mới',
  '/khach': 'Sổ khách',
  '/so-sach': 'Sổ sách',
};

/** Header cố định, kính mờ nổi trên nền gradient mùa — khung của hệ NPP. */
export function Header() {
  const path = usePathname();
  const chuan = path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-header border-b border-border kinh">
      <div className="mx-auto flex h-full max-w-app items-center gap-1 px-2">
        <h1 className="min-w-0 flex-1 truncate px-1.5 text-[1.05rem] font-bold tracking-[-0.01em]">
          {TIEU_DE[chuan] ?? 'Sổ Bếp'}
        </h1>

        <button
          type="button"
          onClick={phatTaiLai}
          aria-label="Làm mới"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-text-2 transition-colors hover:bg-surface-2 active:scale-95"
        >
          <RotateCw className="h-[18px] w-[18px]" />
        </button>

        <ChonMua />
        <TaiKhoan />
      </div>
    </header>
  );
}
