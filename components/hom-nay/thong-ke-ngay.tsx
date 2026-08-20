'use client';

import { phanTram, tien } from '@/lib/format';
import { KpiCard, KpiGrid } from '@/components/npp/kpi';

/**
 * Ba con số của ngày. "Lãi gộp ước" = doanh thu − chi chợ, cố ý ghi chữ "ước":
 * số chính xác nằm ở /so-sach (có nhóm A tồn kho + chi phí khác).
 */
export function ThongKeNgay({ doanhThu, chiCho }: { doanhThu: number; chiCho: number }) {
  const laiGop = doanhThu - chiCho;
  const bienPct = doanhThu > 0 ? (laiGop / doanhThu) * 100 : null;

  return (
    <div className="flex flex-col gap-3">
      <KpiGrid>
        <KpiCard nhan="Doanh thu" giaTri={tien(doanhThu)} />
        <KpiCard nhan="Chi chợ" giaTri={tien(chiCho)} />
      </KpiGrid>

      <div className="flex items-end justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <div className="nhan">Lãi gộp ước</div>
          <div
            className={`tabular mt-1 text-[1.6rem] font-extrabold leading-none ${
              laiGop < 0 ? 'text-danger' : 'text-success'
            }`}
          >
            {tien(laiGop)}
          </div>
        </div>
        {bienPct !== null && (
          <div className="tabular shrink-0 text-right text-sm font-bold text-text-2">
            {phanTram(bienPct, 0)}
          </div>
        )}
      </div>
    </div>
  );
}
