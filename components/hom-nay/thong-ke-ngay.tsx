'use client';

import { phanTram, tien } from '@/lib/format';
import { Card } from '@/components/ui/card';

/**
 * Ba con số của ngày. "Lãi gộp ước" = doanh thu − chi chợ, cố ý ghi chữ "ước":
 * số chính xác nằm ở /so-sach (có nhóm A tồn kho + chi phí khác).
 */
export function ThongKeNgay({ doanhThu, chiCho }: { doanhThu: number; chiCho: number }) {
  const laiGop = doanhThu - chiCho;
  const bienPct = doanhThu > 0 ? (laiGop / doanhThu) * 100 : null;

  return (
    <Card className="divide-y divide-border">
      <Dong nhan="Doanh thu" giaTri={tien(doanhThu)} />
      <Dong nhan="Chi chợ" giaTri={tien(chiCho)} />
      <div className="flex items-baseline justify-between gap-3 p-4">
        <span className="text-sm font-semibold text-muted-foreground">
          Lãi gộp <span className="font-normal">ước</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span
            className={`tabular text-2xl font-bold ${laiGop < 0 ? 'text-danger' : 'text-success'}`}
          >
            {tien(laiGop)}
          </span>
          {bienPct !== null && (
            <span className="tabular w-12 text-right text-sm font-bold text-muted-foreground">
              {phanTram(bienPct, 0)}
            </span>
          )}
        </span>
      </div>
    </Card>
  );
}

function Dong({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <span className="text-sm font-semibold text-muted-foreground">{nhan}</span>
      <span className="tabular text-lg font-bold">{giaTri}</span>
    </div>
  );
}
