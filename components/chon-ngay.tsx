'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { congNgay, homNay, ngayCoThu } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Ngày hôm trước / hôm sau là thao tác thường xuyên nhất → 2 nút ◀ ▶ luôn hiện.
 * Nhảy xa thì bấm vào chính cái ngày, mở date picker của hệ điều hành.
 */
export function ChonNgay({
  ngay,
  doiNgay,
  className,
}: {
  ngay: string;
  doiNgay: (n: string) => void;
  className?: string;
}) {
  const laHomNay = ngay === homNay();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => doiNgay(congNgay(ngay, -1))}
        aria-label="Ngày trước"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <label className="relative flex flex-1 cursor-pointer items-center justify-center">
        <span className="text-base font-bold">
          {ngayCoThu(ngay)}
          {laHomNay && <span className="ml-1.5 text-xs font-semibold text-primary">hôm nay</span>}
        </span>
        <input
          type="date"
          value={ngay}
          onChange={(e) => e.target.value && doiNgay(e.target.value)}
          aria-label="Chọn ngày"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      <button
        type="button"
        onClick={() => doiNgay(congNgay(ngay, 1))}
        aria-label="Ngày sau"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
