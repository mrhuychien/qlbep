'use client';

import { cn } from '@/lib/utils';

/** Lưới số liệu 2 cột trên điện thoại — nhịp "label mờ nhỏ / value đậm to". */
export function KpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3', className)}>{children}</div>;
}

export function KpiCard({
  nhan,
  giaTri,
  phu,
  sacThai = 'thuong',
  className,
}: {
  nhan: string;
  giaTri: React.ReactNode;
  phu?: React.ReactNode;
  sacThai?: 'thuong' | 'tot' | 'canh_bao' | 'nguy';
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 shadow-sm', className)}>
      <div className="nhan">{nhan}</div>
      <div
        className={cn(
          'tabular mt-1 text-[1.35rem] font-extrabold leading-tight',
          sacThai === 'tot' && 'text-success',
          sacThai === 'canh_bao' && 'text-warning',
          sacThai === 'nguy' && 'text-danger',
        )}
      >
        {giaTri}
      </div>
      {phu && <div className="mt-0.5 text-[0.72rem] text-text-2">{phu}</div>}
    </div>
  );
}
