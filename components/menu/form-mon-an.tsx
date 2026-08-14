'use client';

import { useMemo, useRef, useState } from 'react';
import { Lightbulb, Loader2, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import type { MonAn } from '@/lib/types';
import { docSoTien, khop, tien } from '@/lib/format';
import { goiYSoSuat, type GoiYSuat } from '@/lib/goi-y';
import { lichSuMon } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function FormMonAn({
  bepId,
  monAn,
  daCo,
  onThem,
  dangThem,
}: {
  bepId: string;
  monAn: MonAn[];
  daCo: Set<string>;
  onThem: (ten: string, mon: MonAn | null, giaBan: number, suat: number) => void;
  dangThem?: boolean;
}) {
  const [tu, setTu] = useState('');
  const [chon, setChon] = useState<MonAn | null>(null);
  const [gia, setGia] = useState('');
  const [suat, setSuat] = useState('');
  const [goiY, setGoiY] = useState<GoiYSuat | null>(null);
  const [dangTraCuu, setDangTraCuu] = useState(false);
  const oSuat = useRef<HTMLInputElement>(null);

  const ds = useMemo(() => {
    if (!tu.trim()) return [];
    return monAn.filter((m) => !daCo.has(m.id) && khop(m.ten, tu)).slice(0, 6);
  }, [monAn, tu, daCo]);

  const trungTen = monAn.some((m) => m.ten.trim().toLowerCase() === tu.trim().toLowerCase());

  async function chonMon(m: MonAn) {
    setChon(m);
    setTu(m.ten);
    setGia(m.gia_ban_mac_dinh ? String(Math.round(Number(m.gia_ban_mac_dinh))) : '');
    setDangTraCuu(true);
    try {
      const ls = await lichSuMon(bepId, m.id, 7);
      const g = goiYSoSuat(ls);
      setGoiY(g);
      setSuat(String(g.suat));
    } catch {
      setGoiY(null);
    } finally {
      setDangTraCuu(false);
      oSuat.current?.focus();
    }
  }

  function monMoi() {
    setChon(null);
    setGoiY(null);
    oSuat.current?.focus();
  }

  function them() {
    const g = docSoTien(gia);
    const s = Number(suat.replace(',', '.')) || 0;
    if (!tu.trim() || g <= 0 || s <= 0) return;
    onThem(tu.trim(), chon, g, s);
    setTu('');
    setChon(null);
    setGia('');
    setSuat('');
    setGoiY(null);
  }

  const dayDu = tu.trim() && docSoTien(gia) > 0 && Number(suat) > 0;

  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="relative">
        <Input
          value={tu}
          onChange={(e) => {
            setTu(e.target.value);
            setChon(null);
            setGoiY(null);
          }}
          placeholder="Thêm món (gõ tên hoặc chọn)"
          aria-label="Tên món"
          autoComplete="off"
        />
        {tu.trim() && !chon && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-xl border border-border bg-card p-1 shadow-lg">
            {ds.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => chonMon(m)}
                className="flex min-h-tap items-center justify-between gap-2 rounded-lg px-3 text-left transition-colors hover:bg-secondary"
              >
                <span className="truncate font-semibold">{m.ten}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {m.gia_ban_mac_dinh ? tien(m.gia_ban_mac_dinh) : 'chưa có giá'}
                </span>
              </button>
            ))}
            {!trungTen && (
              <button
                type="button"
                onClick={monMoi}
                className="flex min-h-tap items-center gap-2 rounded-lg px-3 text-left font-semibold text-primary transition-colors hover:bg-secondary"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">Món mới “{tu.trim()}”</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          ref={oSuat}
          type="text"
          inputMode="numeric"
          value={suat}
          onChange={(e) => setSuat(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="suất"
          aria-label="Số suất nấu"
          className="tabular w-24 text-center"
        />
        <Input
          type="text"
          inputMode="numeric"
          value={gia}
          onChange={(e) => setGia(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && dayDu) {
              e.preventDefault();
              them();
            }
          }}
          placeholder="giá bán"
          aria-label="Giá bán một suất"
          className="tabular min-w-0 flex-1 text-right"
        />
        <Button type="button" onClick={them} disabled={!dayDu || dangThem} size="icon" className="shrink-0" aria-label="Thêm món">
          {dangThem ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        </Button>
      </div>

      {dangTraCuu && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Đang xem lịch sử món này…
        </p>
      )}

      {goiY?.loiNhan && (
        <p
          className={`flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold ${
            goiY.huong === 'giam' ? 'bg-danger-soft text-danger-ink' : 'bg-success-soft text-success-ink'
          }`}
        >
          {goiY.huong === 'giam' ? (
            <TrendingDown className="mt-px h-3.5 w-3.5 shrink-0" />
          ) : (
            <TrendingUp className="mt-px h-3.5 w-3.5 shrink-0" />
          )}
          {goiY.loiNhan}
        </p>
      )}

      {chon === null && tu.trim() && !dangTraCuu && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 shrink-0" />
          Món mới — thêm xong sẽ được nhớ cho lần sau.
        </p>
      )}
    </Card>
  );
}
