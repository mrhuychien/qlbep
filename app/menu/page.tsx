'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2, UtensilsCrossed } from 'lucide-react';
import { useBep } from '@/lib/bep-context';
import { docSoTien, homNay, tien } from '@/lib/format';
import {
  layMonAn,
  layThucDonNgay,
  suaThucDon,
  taoMonAn,
  themVaoThucDon,
  xoaThucDon,
} from '@/lib/queries';
import type { MonAn, ThucDonNgay } from '@/lib/types';
import { ChonNgay } from '@/components/chon-ngay';
import { DangTaiThe, Loi, Trong } from '@/components/trang-thai';
import { FormMonAn } from '@/components/menu/form-mon-an';
import { SaoChepNgay } from '@/components/menu/sao-chep-ngay';
import { ChiaSeMenu } from '@/components/menu/chia-se-menu';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toastLoi } from '@/components/ui/use-toast';

export default function MenuPage() {
  const { bepId, bep } = useBep();
  const [ngay, setNgay] = useState(homNay());
  const [ds, setDs] = useState<ThucDonNgay[]>([]);
  const [monAn, setMonAn] = useState<MonAn[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangThem, setDangThem] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    if (!bepId) return;
    setDangTai(true);
    setLoi(null);
    try {
      const [td, ma] = await Promise.all([layThucDonNgay(bepId, ngay), layMonAn(bepId)]);
      setDs(td);
      setMonAn(ma);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [bepId, ngay]);

  useEffect(() => {
    void tai();
  }, [tai]);

  async function them(ten: string, mon: MonAn | null, giaBan: number, suat: number) {
    if (!bepId) return;
    setDangThem(true);
    try {
      let m = mon;
      if (!m) {
        // Món mới → tạo record mon_an để lần sau gõ là ra
        m = await taoMonAn(bepId, ten, giaBan);
        setMonAn((p) => [m as MonAn, ...p]);
      }
      const moi = await themVaoThucDon(bepId, ngay, m, giaBan, suat, ds.length);
      setDs((p) => [...p, moi]);
    } catch (e) {
      toastLoi('Chưa thêm được món', e instanceof Error ? e.message : String(e));
    } finally {
      setDangThem(false);
    }
  }

  async function sua(t: ThucDonNgay, thayDoi: Partial<ThucDonNgay>) {
    const truoc = ds;
    setDs((p) => p.map((x) => (x.id === t.id ? { ...x, ...thayDoi } : x)));
    try {
      await suaThucDon(t.id, thayDoi);
    } catch (e) {
      setDs(truoc); // trả về nguyên trạng, không để màn hình nói dối
      toastLoi('Chưa lưu được thay đổi', e instanceof Error ? e.message : String(e));
    }
  }

  async function xoa(t: ThucDonNgay) {
    const truoc = ds;
    setDs((p) => p.filter((x) => x.id !== t.id));
    try {
      await xoaThucDon(t.id);
    } catch (e) {
      setDs(truoc);
      toastLoi('Chưa xoá được món', e instanceof Error ? e.message : String(e));
    }
  }

  const duKien = ds.reduce((s, t) => s + Number(t.gia_ban) * Number(t.sl_du_kien), 0);
  const daCo = new Set(ds.map((t) => t.mon_an_id));

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <h1 className="shrink-0 text-lg font-bold">Thực đơn</h1>
        <ChonNgay ngay={ngay} doiNgay={setNgay} className="flex-1" />
      </header>

      {loi && <Loi loi={loi} thuLai={tai} />}

      {bepId && (
        <FormMonAn bepId={bepId} monAn={monAn} daCo={daCo} onThem={them} dangThem={dangThem} />
      )}

      {dangTai ? (
        <DangTaiThe so={3} cao="h-16" />
      ) : ds.length === 0 ? (
        <Trong
          icon={<UtensilsCrossed className="h-8 w-8" />}
          tieuDe="Chưa có món nào"
          moTa="Gõ tên món ở ô trên, hoặc chép lại thực đơn một ngày cũ."
        />
      ) : (
        <Card className="divide-y divide-border">
          {ds.map((t) => {
            const daBan = Number(t.sl_ban) > 0;
            return (
              <div key={t.id} className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.ten_mon}</p>
                  {daBan && (
                    <p className="tabular text-xs text-muted-foreground">đã bán {t.sl_ban} suất</p>
                  )}
                </div>

                <label className="shrink-0">
                  <span className="sr-only">{t.ten_mon}: số suất</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    defaultValue={String(Number(t.sl_du_kien))}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => {
                      const v = Number(e.target.value.replace(',', '.')) || 0;
                      if (v > 0 && v !== Number(t.sl_du_kien)) void sua(t, { sl_du_kien: v });
                      else e.target.value = String(Number(t.sl_du_kien));
                    }}
                    className="tabular h-11 w-16 text-center"
                  />
                </label>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">suất</span>

                <label className="w-24 shrink-0">
                  <span className="sr-only">{t.ten_mon}: giá bán</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    defaultValue={String(Math.round(Number(t.gia_ban)))}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => {
                      const v = docSoTien(e.target.value);
                      if (v > 0 && v !== Number(t.gia_ban)) void sua(t, { gia_ban: v });
                      else e.target.value = String(Math.round(Number(t.gia_ban)));
                    }}
                    className="tabular h-11 text-right"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => xoa(t)}
                  disabled={daBan}
                  title={daBan ? 'Món đã có đơn bán — không xoá được, sửa số suất thay vì xoá' : undefined}
                  aria-label={`Xoá ${t.ten_mon}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </Card>
      )}

      {ds.some((t) => Number(t.sl_ban) > 0) && (
        <p className="px-1 text-xs text-muted-foreground">
          Món đã có đơn bán thì không xoá được — sửa số suất thay vì xoá, để đơn cũ không mất dấu.
        </p>
      )}

      <div className="flex items-baseline justify-between rounded-xl bg-secondary px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Dự kiến doanh thu
        </span>
        <span className="tabular text-xl font-bold">{tien(duKien)}</span>
      </div>

      <div className="flex gap-2">
        {bepId && <SaoChepNgay bepId={bepId} ngay={ngay} onXong={tai} />}
        <ChiaSeMenu ngay={ngay} ds={ds} sdt={bep?.sdt} />
      </div>
    </div>
  );
}
