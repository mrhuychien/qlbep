'use client';

import { Loader2, Save } from 'lucide-react';
import type { KenhDat } from '@/lib/types';
import { KENH_DAT_LABEL } from '@/lib/types';
import { docSoTien, tien } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SHIP_NHANH = [0, 10000, 15000, 20000];
const KENH: KenhDat[] = ['zalo', 'facebook', 'dien_thoai', 'truc_tiep'];

export function TomTatDon({
  tongHang,
  ship,
  setShip,
  kenh,
  setKenh,
  daThu,
  setDaThu,
  dangLuu,
  coTheLuu,
  onLuu,
}: {
  tongHang: number;
  ship: string;
  setShip: (v: string) => void;
  kenh: KenhDat;
  setKenh: (v: KenhDat) => void;
  daThu: boolean;
  setDaThu: (v: boolean) => void;
  dangLuu: boolean;
  coTheLuu: boolean;
  onLuu: () => void;
}) {
  const tong = tongHang + docSoTien(ship);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-text-2">
          Ship khách trả
        </span>
        <div className="flex items-center gap-1.5">
          {SHIP_NHANH.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setShip(String(s))}
              className={cn(
                'tabular h-11 flex-1 rounded-xl border text-sm font-bold transition-colors',
                docSoTien(ship) === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-text-2',
              )}
            >
              {s === 0 ? '0' : `${s / 1000}k`}
            </button>
          ))}
          <Input
            type="text"
            inputMode="numeric"
            value={ship}
            onChange={(e) => setShip(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-label="Phí ship khách trả"
            className="tabular h-11 w-20 text-right"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-text-2">Kênh đặt</span>
        <div className="flex items-center gap-1.5">
          {KENH.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKenh(k)}
              className={cn(
                'h-11 flex-1 rounded-xl border text-sm font-bold transition-colors',
                kenh === k
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-text-2',
              )}
            >
              {KENH_DAT_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <label className="flex min-h-tap cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card px-4">
        <span className="font-semibold">
          {daThu ? 'Đã thu tiền' : 'Chưa thu tiền'}
          <span className="ml-1.5 text-xs font-normal text-text-2">
            {daThu ? 'mặc định' : 'sẽ vào công nợ'}
          </span>
        </span>
        <input
          type="checkbox"
          checked={daThu}
          onChange={(e) => setDaThu(e.target.checked)}
          style={{ accentColor: 'var(--mua-1)' }}
          className="h-6 w-6"
        />
      </label>

      <div className="flex items-baseline justify-between rounded-lg bg-surface-2 px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-text-2">Tổng</span>
        <span className="tabular text-2xl font-bold">{tien(tong)}</span>
      </div>

      <Button onClick={onLuu} disabled={!coTheLuu || dangLuu} className="w-full" size="lg">
        {dangLuu ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {dangLuu ? 'Đang lưu…' : 'Lưu đơn'}
      </Button>
    </div>
  );
}
