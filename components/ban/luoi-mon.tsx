'use client';

import { useRef } from 'react';
import { Minus } from 'lucide-react';
import type { ThucDonNgay } from '@/lib/types';
import { tien } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Lưới nút to: chạm = +1. Giảm có HAI đường — chạm giữ (nhanh cho người quen)
 * và nút − hiện ra khi đã chọn (thấy được, cho người mới). Cử chỉ không bao giờ
 * là đường duy nhất.
 */
export function LuoiMon({
  ds,
  soLuong,
  onDoi,
}: {
  ds: ThucDonNgay[];
  soLuong: Record<string, number>;
  onDoi: (thucDonId: string, so: number) => void;
}) {
  const giuRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const daGiu = useRef(false);

  function batDauGiu(id: string, hienTai: number) {
    daGiu.current = false;
    giuRef.current = setTimeout(() => {
      daGiu.current = true;
      onDoi(id, Math.max(0, hienTai - 1));
    }, 450);
  }

  function thoiGiu() {
    if (giuRef.current) clearTimeout(giuRef.current);
    giuRef.current = null;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ds.map((t) => {
        const conLai = Number(t.sl_du_kien) - Number(t.sl_ban);
        const het = conLai <= 0;
        const so = soLuong[t.id] ?? 0;

        return (
          <div key={t.id} className="relative">
            <button
              type="button"
              disabled={het}
              onClick={() => {
                if (daGiu.current) {
                  daGiu.current = false;
                  return;
                }
                onDoi(t.id, so + 1);
              }}
              onPointerDown={() => !het && batDauGiu(t.id, so)}
              onPointerUp={thoiGiu}
              onPointerLeave={thoiGiu}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={`${t.ten_mon}, ${tien(t.gia_ban)}${het ? ', đã hết' : `, còn ${conLai} suất`}${
                so > 0 ? `, đang chọn ${so}` : ''
              }`}
              className={cn(
                'flex h-24 w-full select-none flex-col items-center justify-center gap-0.5 rounded-xl border p-2 text-center transition-colors',
                het
                  ? 'border-border bg-secondary text-muted-foreground'
                  : so > 0
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card active:bg-secondary',
              )}
            >
              <span className="line-clamp-2 text-sm font-semibold leading-tight">{t.ten_mon}</span>
              <span className="tabular text-xs font-bold text-muted-foreground">{tien(t.gia_ban)}</span>
              {het ? (
                <span className="text-xs font-bold uppercase">hết</span>
              ) : (
                <span className="tabular text-[11px] text-muted-foreground">còn {conLai}</span>
              )}
            </button>

            {so > 0 && (
              <>
                <span className="tabular pointer-events-none absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-1.5 text-sm font-bold text-primary-foreground">
                  {so}
                </span>
                <button
                  type="button"
                  onClick={() => onDoi(t.id, so - 1)}
                  aria-label={`Bớt 1 ${t.ten_mon}`}
                  className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm active:scale-95"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
