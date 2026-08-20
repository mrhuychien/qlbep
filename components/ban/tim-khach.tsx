'use client';

import { useMemo, useState } from 'react';
import { Phone, UserPlus, X } from 'lucide-react';
import type { KhachHang } from '@/lib/types';
import { boDau, chuanSdt, khop } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface KhachChon {
  khach_hang_id: string | null;
  ten: string;
  sdt: string | null;
  dia_chi: string | null;
  /** true = khách lẻ, không tạo hồ sơ */
  vangLai: boolean;
}

/**
 * Gõ 3 số cuối SĐT là ra khách cũ. Gõ chữ thì tìm theo tên (không dấu).
 * Khách mới có SĐT → tạo hồ sơ để lần sau tự nhớ.
 * Khách lẻ mua tại chỗ → chỉ ghi tên vào đơn, không đẻ hồ sơ rác.
 */
export function TimKhach({
  ds,
  chon,
  onChon,
  onBo,
}: {
  ds: KhachHang[];
  chon: KhachChon | null;
  onChon: (k: KhachChon) => void;
  onBo: () => void;
}) {
  const [tu, setTu] = useState('');
  const [tenMoi, setTenMoi] = useState('');
  const [diaChiMoi, setDiaChiMoi] = useState('');

  const laSo = /^[\d\s.+]+$/.test(tu.trim()) && tu.trim().length >= 2;

  const goiY = useMemo(() => {
    const t = tu.trim();
    if (!t) return [];
    if (laSo) {
      const so = chuanSdt(t);
      return ds.filter((k) => chuanSdt(k.sdt).includes(so)).slice(0, 6);
    }
    return ds.filter((k) => khop(k.ten, t) || boDau(k.dia_chi ?? '').includes(boDau(t))).slice(0, 6);
  }, [ds, tu, laSo]);

  if (chon) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {chon.ten}
            {chon.vangLai && <span className="ml-1.5 text-xs font-semibold text-text-2">khách lẻ</span>}
          </p>
          <p className="truncate text-sm text-text-2">
            {[chon.sdt, chon.dia_chi].filter(Boolean).join(' · ') || 'Chưa có địa chỉ'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTu('');
            setTenMoi('');
            setDiaChiMoi('');
            onBo();
          }}
          aria-label="Đổi khách"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-2 hover:bg-surface-2"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-2" />
        <Input
          value={tu}
          onChange={(e) => setTu(e.target.value)}
          placeholder="Gõ SĐT hoặc tên…"
          aria-label="Tìm khách theo số điện thoại hoặc tên"
          className="pl-10"
          autoComplete="off"
        />
      </div>

      {tu.trim() && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-1">
          {goiY.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() =>
                onChon({
                  khach_hang_id: k.id,
                  ten: k.ten,
                  sdt: k.sdt,
                  dia_chi: k.dia_chi,
                  vangLai: false,
                })
              }
              className="flex min-h-tap flex-col justify-center rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-surface-2"
            >
              <span className="truncate font-semibold">{k.ten}</span>
              <span className="truncate text-xs text-text-2">
                {[k.sdt, k.dia_chi].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}

          {goiY.length === 0 && laSo && (
            <div className="flex flex-col gap-2 p-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                <UserPlus className="h-4 w-4" />
                Khách mới — {chuanSdt(tu)}
              </p>
              <Input
                value={tenMoi}
                onChange={(e) => setTenMoi(e.target.value)}
                placeholder="Tên khách"
                aria-label="Tên khách mới"
                autoFocus
              />
              <Input
                value={diaChiMoi}
                onChange={(e) => setDiaChiMoi(e.target.value)}
                placeholder="Địa chỉ giao"
                aria-label="Địa chỉ giao"
              />
              <Button
                type="button"
                disabled={!tenMoi.trim()}
                onClick={() =>
                  onChon({
                    khach_hang_id: null,
                    ten: tenMoi.trim(),
                    sdt: chuanSdt(tu),
                    dia_chi: diaChiMoi.trim() || null,
                    vangLai: false,
                  })
                }
              >
                Lưu khách mới
              </Button>
            </div>
          )}

          {goiY.length === 0 && !laSo && (
            <button
              type="button"
              onClick={() =>
                onChon({
                  khach_hang_id: null,
                  ten: tu.trim(),
                  sdt: null,
                  dia_chi: null,
                  vangLai: true,
                })
              }
              className="flex min-h-tap items-center gap-2 rounded-lg px-3 text-left font-semibold text-primary transition-colors hover:bg-surface-2"
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              <span className="truncate">Khách lẻ “{tu.trim()}” — không lưu hồ sơ</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
