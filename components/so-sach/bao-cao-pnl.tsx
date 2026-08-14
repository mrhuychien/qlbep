'use client';

import type { Pnl } from '@/lib/types';
import { phanTram, tien } from '@/lib/format';
import { Card } from '@/components/ui/card';

/**
 * Giá vốn = chi nhóm B nguyên + (tồn đầu A + mua A − tồn cuối A).
 * Tách rõ hai nhóm vì đó là khái niệm người dùng phải hiểu để tin con số.
 */
export function BaoCaoPnl({ pnl }: { pnl: Pnl }) {
  const nhomA = Number(pnl.ton_dau_a) + Number(pnl.mua_nhom_a) - Number(pnl.ton_cuoi_a);
  const laiRong = Number(pnl.lai_rong);
  const bienRong = Number(pnl.doanh_thu) > 0 ? (laiRong / Number(pnl.doanh_thu)) * 100 : null;

  return (
    <Card className="flex flex-col">
      <Dong nhan="Doanh thu" so={Number(pnl.doanh_thu)} dam />

      <Dong nhan="− Giá vốn nguyên liệu" so={Number(pnl.gia_von)} pct={pnl.food_cost_pct} />
      <DongPhu nhan="Nhóm B (mua – dùng ngay)" so={Number(pnl.chi_nhom_b)} />
      <DongPhu nhan="Nhóm A (tồn đầu + mua − tồn cuối)" so={nhomA} />

      <Dong nhan="− Chi phí khác" so={Number(pnl.chi_phi_khac_)} />

      <div className="flex items-baseline justify-between gap-3 border-t-2 border-foreground/10 px-4 py-3">
        <span className="font-bold uppercase tracking-wide">Lãi ròng</span>
        <span className="flex items-baseline gap-2">
          <span className={`tabular text-2xl font-bold ${laiRong < 0 ? 'text-danger' : 'text-success'}`}>
            {tien(laiRong)}
          </span>
          {bienRong !== null && (
            <span className="tabular w-14 text-right text-sm font-bold text-muted-foreground">
              {phanTram(bienRong)}
            </span>
          )}
        </span>
      </div>

      {Number(pnl.ton_dau_a) === 0 && Number(pnl.ton_cuoi_a) === 0 && (
        <p className="px-4 pb-3 text-xs text-muted-foreground">
          Chưa có phiếu kiểm kê nào được chốt, nên nhóm A đang tính bằng đúng số đã mua trong kỳ.
          Kiểm kê ở tab bên cạnh để số này sát hơn.
        </p>
      )}
    </Card>
  );
}

function Dong({ nhan, so, pct, dam }: { nhan: string; so: number; pct?: number | null; dam?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
      <span className={`text-sm ${dam ? 'font-bold' : 'font-semibold text-muted-foreground'}`}>{nhan}</span>
      <span className="flex items-baseline gap-2">
        <span className={`tabular ${dam ? 'text-lg font-bold' : 'font-bold'}`}>{tien(so)}</span>
        <span className="tabular w-14 text-right text-xs font-bold text-muted-foreground">
          {pct !== undefined && pct !== null ? phanTram(pct) : ''}
        </span>
      </span>
    </div>
  );
}

function DongPhu({ nhan, so }: { nhan: string; so: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 pl-8 pr-4">
      <span className="text-xs text-muted-foreground">{nhan}</span>
      <span className="tabular pr-16 text-sm">{tien(so)}</span>
    </div>
  );
}
