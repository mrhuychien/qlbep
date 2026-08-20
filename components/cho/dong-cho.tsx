'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ThucDonNgay } from '@/lib/types';
import { docSoTien, tien } from '@/lib/format';
import { Input } from '@/components/ui/input';

export interface DongCho {
  key: string;
  nguyen_lieu_id: string;
  ten: string;
  dvt_cho: string;
  gia_gan_nhat: number | null;
  /**
   * true = chỉ gõ số tiền, bỏ qua số lượng và đơn giá ("Dầu, gia vị — 80k").
   * Schema bắt so_luong và don_gia not null nên dòng gọn lưu so_luong = 1,
   * don_gia = số tiền; cột thanh_tien (generated) vẫn ra đúng.
   */
  gon: boolean;
  so_luong: string;
  don_gia: string;
  thanh_tien: string;
  /** Ô người dùng vừa gõ — ô còn lại là ô được tính ra. */
  neo: 'don_gia' | 'thanh_tien';
  mon_an_id: string | null;
}

const CHENH_CANH_BAO = 0.3; // lệch >30% so với lần mua trước thì nhắc

export function tinhLai(d: DongCho, oiVua: 'so_luong' | 'don_gia' | 'thanh_tien'): DongCho {
  // Dòng gọn: tiền gõ vào là tất cả, số lượng luôn là 1
  if (d.gon) {
    const tt = docSoTien(d.thanh_tien);
    return { ...d, so_luong: '1', don_gia: tt > 0 ? String(tt) : '', neo: 'thanh_tien' };
  }

  const sl = Number(d.so_luong.replace(',', '.')) || 0;

  if (oiVua === 'don_gia') {
    const dg = docSoTien(d.don_gia);
    return { ...d, neo: 'don_gia', thanh_tien: sl > 0 ? String(Math.round(sl * dg)) : d.thanh_tien };
  }
  if (oiVua === 'thanh_tien') {
    const tt = docSoTien(d.thanh_tien);
    return { ...d, neo: 'thanh_tien', don_gia: sl > 0 ? String(Math.round(tt / sl)) : d.don_gia };
  }
  // đổi số lượng → giữ nguyên ô đang neo, tính lại ô kia
  if (d.neo === 'don_gia') {
    const dg = docSoTien(d.don_gia);
    return { ...d, thanh_tien: sl > 0 && dg > 0 ? String(Math.round(sl * dg)) : '' };
  }
  const tt = docSoTien(d.thanh_tien);
  return { ...d, don_gia: sl > 0 && tt > 0 ? String(Math.round(tt / sl)) : '' };
}

/**
 * Chuyển chế độ mà KHÔNG mất số tiền đã gõ.
 * Gọn → chi tiết: giữ thành tiền, đặt số lượng 1, neo vào thành tiền — gõ
 * "5" vào ô kg là đơn giá tự ra 600.000/5 = 120.000.
 */
export function datGon(d: DongCho, gon: boolean): DongCho {
  const tt = docSoTien(d.thanh_tien);
  if (gon) return { ...d, gon: true, so_luong: '1', don_gia: tt > 0 ? String(tt) : '', neo: 'thanh_tien' };
  return {
    ...d,
    gon: false,
    so_luong: d.so_luong || '1',
    don_gia: tt > 0 ? String(Math.round(tt / (Number(d.so_luong) || 1))) : d.don_gia,
    neo: 'thanh_tien',
  };
}

export function DongChoRow({
  dong,
  monHomNay,
  tuDongFocus,
  onSua,
  onXoa,
  onXong,
}: {
  dong: DongCho;
  monHomNay: ThucDonNgay[];
  tuDongFocus?: boolean;
  onSua: (d: DongCho) => void;
  onXoa: () => void;
  onXong: () => void;
}) {
  const oDau = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tuDongFocus) oDau.current?.focus();
  }, [tuDongFocus, dong.gon]);

  const dgHienTai = docSoTien(dong.don_gia);
  const lech =
    !dong.gon && dong.gia_gan_nhat && dgHienTai > 0
      ? Math.abs(dgHienTai - dong.gia_gan_nhat) / dong.gia_gan_nhat
      : 0;

  function enterLaXong(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onXong();
    }
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">{dong.ten}</span>

        <button
          type="button"
          onClick={() => onSua(datGon(dong, !dong.gon))}
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-2"
        >
          {dong.gon ? `Theo ${dong.dvt_cho}` : 'Chỉ tiền'}
        </button>

        <button
          type="button"
          onClick={onXoa}
          aria-label={`Xoá dòng ${dong.ten}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-surface-2 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {dong.gon ? (
        <>
          <Input
            ref={oDau}
            type="text"
            inputMode="numeric"
            value={dong.thanh_tien}
            onChange={(e) => onSua(tinhLai({ ...dong, thanh_tien: e.target.value }, 'thanh_tien'))}
            onFocus={(e) => e.target.select()}
            onKeyDown={enterLaXong}
            placeholder="hết bao nhiêu tiền"
            aria-label={`${dong.ten}: số tiền`}
            className="tabular h-11 text-right text-lg font-bold"
          />
          {dong.gia_gan_nhat ? (
            <button
              type="button"
              onClick={() => onSua(datGon(dong, false))}
              className="self-start text-xs font-semibold text-text-2 underline decoration-dotted"
            >
              Lần trước {tien(dong.gia_gan_nhat)}/{dong.dvt_cho} — bấm để nhập theo {dong.dvt_cho}
            </button>
          ) : null}
        </>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="relative w-[4.5rem] shrink-0">
            <Input
              ref={oDau}
              type="text"
              inputMode="decimal"
              value={dong.so_luong}
              onChange={(e) => onSua(tinhLai({ ...dong, so_luong: e.target.value }, 'so_luong'))}
              onFocus={(e) => e.target.select()}
              onKeyDown={enterLaXong}
              aria-label={`${dong.ten}: số lượng`}
              className="tabular h-11 pr-8 text-center"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-2">
              {dong.dvt_cho}
            </span>
          </div>

          <Input
            type="text"
            inputMode="numeric"
            value={dong.don_gia}
            onChange={(e) => onSua(tinhLai({ ...dong, don_gia: e.target.value }, 'don_gia'))}
            onFocus={(e) => e.target.select()}
            onKeyDown={enterLaXong}
            placeholder="đơn giá"
            aria-label={`${dong.ten}: đơn giá`}
            className="tabular h-11 min-w-0 flex-1 text-right"
          />

          <span className="shrink-0 text-sm font-bold text-text-2">=</span>

          <Input
            type="text"
            inputMode="numeric"
            value={dong.thanh_tien}
            onChange={(e) => onSua(tinhLai({ ...dong, thanh_tien: e.target.value }, 'thanh_tien'))}
            onFocus={(e) => e.target.select()}
            onKeyDown={enterLaXong}
            placeholder="thành tiền"
            aria-label={`${dong.ten}: thành tiền`}
            className="tabular h-11 min-w-0 flex-1 text-right font-bold"
          />
        </div>
      )}

      {/* Chọn món: dùng select gốc của hệ điều hành — mở bánh xe chọn 1 chạm,
          nhanh hơn popup tự vẽ. Đây là màn tính bằng giây. */}
      <div className="flex items-center gap-2">
        <select
          value={dong.mon_an_id ?? ''}
          onChange={(e) => onSua({ ...dong, mon_an_id: e.target.value || null })}
          aria-label={`${dong.ten}: gán cho món`}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm font-semibold text-text-2 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— Chi phí chung —</option>
          {monHomNay.map((m) => (
            <option key={m.id} value={m.mon_an_id}>
              {m.ten_mon}
            </option>
          ))}
        </select>

        {lech > CHENH_CANH_BAO && (
          <span className="shrink-0 text-xs font-semibold text-warning-ink">
            Lần trước {tien(dong.gia_gan_nhat)}/{dong.dvt_cho}
          </span>
        )}
      </div>
    </div>
  );
}
