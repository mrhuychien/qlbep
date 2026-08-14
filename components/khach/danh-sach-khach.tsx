'use client';

import { MessageCircle, Phone } from 'lucide-react';
import type { KhachHang } from '@/lib/types';
import { chuanSdt, tien, truoc } from '@/lib/format';
import { Card } from '@/components/ui/card';

export function DanhSachKhach({
  ds,
  onXem,
  nhanPhu,
}: {
  ds: KhachHang[];
  onXem: (k: KhachHang) => void;
  nhanPhu?: (k: KhachHang) => string | null;
}) {
  return (
    <Card className="divide-y divide-border">
      {ds.map((k) => {
        const phu = nhanPhu?.(k) ?? null;
        const sdt = chuanSdt(k.sdt);
        return (
          <div key={k.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onXem(k)}
              className="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-3 py-2.5 text-left"
            >
              <span className="w-full truncate font-semibold">{k.ten}</span>
              <span className="tabular w-full truncate text-xs text-muted-foreground">
                {k.tong_don} đơn · {tien(k.tong_tien)} · {truoc(k.lan_cuoi_dat)}
              </span>
              {phu && <span className="text-xs font-bold text-danger">{phu}</span>}
            </button>

            {/* Hai lối liên hệ, luôn nhìn thấy — không giấu sau menu */}
            <a
              href={`https://zalo.me/${sdt}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Nhắn Zalo cho ${k.ten}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-secondary"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href={`tel:${sdt}`}
              aria-label={`Gọi ${k.ten}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-secondary"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        );
      })}
    </Card>
  );
}
