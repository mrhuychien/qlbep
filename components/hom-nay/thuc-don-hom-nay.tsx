'use client';

import Link from 'next/link';
import { AlertTriangle, Check, UtensilsCrossed } from 'lucide-react';
import type { ThucDonNgay } from '@/lib/types';
import { homNay, tien } from '@/lib/format';
import { Trong } from '@/components/trang-thai';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TinhTrang = 'het' | 'nguy_co_e' | 'thuong';

/**
 * Xanh = bán hết (≥100%). Đỏ = nguy cơ ế: bán dưới 40% và đã quá 12h trưa
 * (ngày cũ thì xét luôn, vì buổi bán đã kết thúc).
 * Màu KHÔNG đứng một mình — luôn kèm icon ✓ / ⚠ để đọc được cả khi chói nắng.
 */
export function tinhTrangMon(t: ThucDonNgay, ngay: string): TinhTrang {
  const tyLe = t.sl_du_kien > 0 ? t.sl_ban / t.sl_du_kien : 0;
  if (tyLe >= 1) return 'het';
  const daQuaTrua = ngay < homNay() || new Date().getHours() >= 12;
  if (tyLe < 0.4 && daQuaTrua) return 'nguy_co_e';
  return 'thuong';
}

export function ThucDonHomNay({ ds, ngay }: { ds: ThucDonNgay[]; ngay: string }) {
  if (!ds.length) {
    return (
      <Trong
        icon={<UtensilsCrossed className="h-8 w-8" />}
        tieuDe="Chưa chốt thực đơn"
        moTa="Chốt hôm nay nấu món gì để bắt đầu nhận đơn."
        hanhDong={
          <Button asChild>
            <Link href="/menu">Lên thực đơn</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Card className="divide-y divide-border">
      {ds.map((t) => {
        const tt = tinhTrangMon(t, ngay);
        const tyLe = t.sl_du_kien > 0 ? Math.min(t.sl_ban / t.sl_du_kien, 1) : 0;
        return (
          <div key={t.id} className="flex flex-col gap-1.5 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold">{t.ten_mon}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {tt === 'het' && <Check className="h-4 w-4 text-success" aria-label="Đã bán hết" />}
                {tt === 'nguy_co_e' && (
                  <AlertTriangle className="h-4 w-4 text-danger" aria-label="Nguy cơ ế" />
                )}
                <span className="tabular text-sm font-bold text-muted-foreground">
                  {tien(t.gia_ban)}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="tabular w-16 shrink-0 text-sm font-bold">
                {t.sl_ban}
                <span className="font-medium text-muted-foreground">/{t.sl_du_kien}</span>
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuenow={Math.round(tyLe * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t.ten_mon}: bán ${t.sl_ban} trên ${t.sl_du_kien} suất`}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-300',
                    tt === 'het' ? 'bg-success' : tt === 'nguy_co_e' ? 'bg-danger' : 'bg-primary',
                  )}
                  style={{ width: `${Math.max(tyLe * 100, tyLe > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>

            {t.da_chot && t.sl_du !== null && t.sl_du > 0 && (
              <p className="text-xs font-semibold text-danger">Dư {t.sl_du} suất</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
