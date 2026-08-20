'use client';

import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

/** Màn trống — là trải nghiệm ngày đầu dùng app, không phải chỗ bỏ quên. */
export function Trong({
  icon,
  tieuDe,
  moTa,
  hanhDong,
}: {
  icon?: React.ReactNode;
  tieuDe: string;
  moTa?: string;
  hanhDong?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-4 py-12 text-center shadow-sm">
      {icon && <div className="text-3xl text-text-3">{icon}</div>}
      <p className="text-[1.1rem] font-bold">{tieuDe}</p>
      {moTa && <p className="max-w-xs text-sm text-text-2">{moTa}</p>}
      {hanhDong && <div className="mt-2">{hanhDong}</div>}
    </div>
  );
}

/** Lỗi phải nói cái gì hỏng và làm gì tiếp — không im lặng, không "Có lỗi xảy ra". */
export function Loi({ loi, thuLai }: { loi: string; thuLai?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-4">
      <div className="flex items-center gap-2 font-bold text-danger-ink">
        <AlertTriangle className="h-5 w-5" />
        Không tải được dữ liệu
      </div>
      <p className="text-sm text-danger-ink/80">{loi}</p>
      {thuLai && (
        <Button variant="outline" size="sm" onClick={thuLai} className="mt-1">
          Thử lại
        </Button>
      )}
    </div>
  );
}

export function DangTaiThe({ so = 3, cao = 'h-16' }: { so?: number; cao?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: so }).map((_, i) => (
        <Skeleton key={i} className={cao} />
      ))}
    </div>
  );
}
