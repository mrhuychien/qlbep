'use client';

import { forwardRef, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { NguyenLieu } from '@/lib/types';
import { khop, tien } from '@/lib/format';
import { Input } from '@/components/ui/input';

/**
 * Gõ 2–3 ký tự KHÔNG DẤU là ra. "tbc" hay "ba chi" đều ra "Thịt ba chỉ".
 * Không tìm thấy thì tạo mới ngay tại chỗ — ngoài chợ không ai quay về màn
 * danh mục để khai báo nguyên liệu trước.
 */
export const TimNguyenLieu = forwardRef<
  HTMLInputElement,
  {
    ds: NguyenLieu[];
    daChon: Set<string>;
    onChon: (nl: NguyenLieu) => void;
    onTaoMoi: (ten: string) => void;
    dangTao?: boolean;
  }
>(function TimNguyenLieu({ ds, daChon, onChon, onTaoMoi, dangTao }, ref) {
  const [tu, setTu] = useState('');

  const goiY = useMemo(() => {
    if (!tu.trim()) return [];
    return ds.filter((n) => !daChon.has(n.id) && khop(n.ten, tu)).slice(0, 8);
  }, [ds, tu, daChon]);

  const trungTen = ds.some((n) => n.ten.trim().toLowerCase() === tu.trim().toLowerCase());

  function chon(nl: NguyenLieu) {
    onChon(nl);
    setTu('');
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          value={tu}
          onChange={(e) => setTu(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (goiY[0]) chon(goiY[0]);
              else if (tu.trim() && !trungTen) onTaoMoi(tu.trim());
            }
            if (e.key === 'Escape') setTu('');
          }}
          placeholder="Gõ tên nguyên liệu…"
          aria-label="Tìm nguyên liệu"
          className="pl-10"
          enterKeyHint="done"
          autoComplete="off"
        />
      </div>

      {tu.trim() && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-1">
          {goiY.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => chon(n)}
              className="flex min-h-tap items-center justify-between gap-2 rounded-lg px-3 text-left transition-colors hover:bg-secondary active:bg-secondary"
            >
              <span className="truncate font-semibold">{n.ten}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {n.gia_gan_nhat ? `${tien(n.gia_gan_nhat)}/${n.dvt_cho}` : n.dvt_cho}
                {n.phan_loai === 'A' && <span className="ml-1.5 font-bold text-primary">A</span>}
              </span>
            </button>
          ))}

          {!trungTen && (
            <button
              type="button"
              disabled={dangTao}
              onClick={() => {
                onTaoMoi(tu.trim());
                setTu('');
              }}
              className="flex min-h-tap items-center gap-2 rounded-lg px-3 text-left font-semibold text-primary transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="truncate">Tạo “{tu.trim()}”</span>
            </button>
          )}

          {goiY.length === 0 && trungTen && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Đã có trong danh sách bên dưới.</p>
          )}
        </div>
      )}
    </div>
  );
});
