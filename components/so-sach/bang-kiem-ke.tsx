'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, PackageSearch, Save } from 'lucide-react';
import type { NguyenLieu } from '@/lib/types';
import { docSoTien, homNay, tien } from '@/lib/format';
import { layKiemKe, layNguyenLieu, luuKiemKe } from '@/lib/queries';
import { ChonNgay } from '@/components/chon-ngay';
import { DangTaiThe, Trong } from '@/components/trang-thai';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

interface DongKk {
  so_luong: string;
  don_gia: string;
}

/** Chỉ kiểm nhóm A. Rau thịt tươi (nhóm B) đã tính chi phí ngay khi mua. */
export function BangKiemKe({ bepId }: { bepId: string }) {
  const [ngay, setNgay] = useState(homNay());
  const [nl, setNl] = useState<NguyenLieu[]>([]);
  const [gt, setGt] = useState<Record<string, DongKk>>({});
  const [daChot, setDaChot] = useState(false);
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);

  const tai = useCallback(async () => {
    setDangTai(true);
    try {
      const [ds, kk] = await Promise.all([layNguyenLieu(bepId), layKiemKe(bepId, ngay)]);
      const nhomA = ds.filter((n) => n.phan_loai === 'A');
      setNl(nhomA);
      setDaChot(kk?.da_chot ?? false);

      const daCo = new Map((kk?.kiem_ke_ct ?? []).map((c) => [c.nguyen_lieu_id, c]));
      const map: Record<string, DongKk> = {};
      for (const n of nhomA) {
        const c = daCo.get(n.id);
        map[n.id] = {
          so_luong: c ? String(Number(c.so_luong)) : '',
          // Giá lấy từ lần mua gần nhất — sửa đè được
          don_gia: c
            ? String(Math.round(Number(c.don_gia)))
            : n.gia_gan_nhat
              ? String(Math.round(Number(n.gia_gan_nhat)))
              : '',
        };
      }
      setGt(map);
    } catch (e) {
      toastLoi('Chưa tải được kiểm kê', e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [bepId, ngay]);

  useEffect(() => {
    void tai();
  }, [tai]);

  async function luu(chot: boolean) {
    setDangLuu(true);
    try {
      await luuKiemKe(
        bepId,
        ngay,
        nl.map((n) => ({
          nguyen_lieu_id: n.id,
          so_luong: Number((gt[n.id]?.so_luong ?? '').replace(',', '.')) || 0,
          don_gia: docSoTien(gt[n.id]?.don_gia ?? ''),
        })),
        chot,
      );
      setDaChot(chot);
      toastOk(chot ? 'Đã chốt kiểm kê' : 'Đã lưu nháp kiểm kê');
    } catch (e) {
      toastLoi('Chưa lưu được', e instanceof Error ? e.message : String(e));
    } finally {
      setDangLuu(false);
    }
  }

  const tong = nl.reduce((s, n) => {
    const d = gt[n.id];
    if (!d) return s;
    return s + (Number(d.so_luong.replace(',', '.')) || 0) * docSoTien(d.don_gia);
  }, 0);

  const soDaNhap = nl.filter((n) => (Number(gt[n.id]?.so_luong) || 0) > 0).length;

  return (
    <div className="flex flex-col gap-3">
      <ChonNgay ngay={ngay} doiNgay={setNgay} />

      <p className="rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
        Chỉ kiểm nhóm A. Rau thịt tươi đã tính chi phí ngay khi mua.
      </p>

      {daChot && (
        <Badge variant="success" className="self-start">
          <Check className="mr-1 h-3.5 w-3.5" /> Đã chốt ngày này
        </Badge>
      )}

      {dangTai ? (
        <DangTaiThe so={6} cao="h-12" />
      ) : nl.length === 0 ? (
        <Trong
          icon={<PackageSearch className="h-8 w-8" />}
          tieuDe="Chưa có nguyên liệu nhóm A"
          moTa="Nhóm A là đồ có kiểm kê: gạo, dầu, gas, đồ khô, gia vị. Đánh dấu phân loại A cho nguyên liệu trong Supabase hoặc khi tạo mới."
        />
      ) : (
        <Card className="divide-y divide-border">
          {nl.map((n) => (
            <div key={n.id} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{n.ten}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={gt[n.id]?.so_luong ?? ''}
                onChange={(e) => setGt((p) => ({ ...p, [n.id]: { ...p[n.id], so_luong: e.target.value } }))}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                aria-label={`${n.ten}: số lượng tồn`}
                className="tabular h-11 w-16 shrink-0 text-center"
              />
              <span className="w-8 shrink-0 text-xs font-semibold text-muted-foreground">{n.dvt_cho}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={gt[n.id]?.don_gia ?? ''}
                onChange={(e) => setGt((p) => ({ ...p, [n.id]: { ...p[n.id], don_gia: e.target.value } }))}
                onFocus={(e) => e.target.select()}
                placeholder="giá"
                aria-label={`${n.ten}: đơn giá`}
                className="tabular h-11 w-24 shrink-0 text-right"
              />
            </div>
          ))}
        </Card>
      )}

      <div className="flex items-baseline justify-between rounded-xl bg-secondary px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Tổng tồn · {soDaNhap}/{nl.length} dòng
        </span>
        <span className="tabular text-xl font-bold">{tien(tong)}</span>
      </div>

      {nl.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => luu(false)} disabled={dangLuu} className="flex-1">
            {dangLuu ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Lưu nháp
          </Button>
          <Button onClick={() => luu(true)} disabled={dangLuu} className="flex-1">
            <Check className="h-5 w-5" />
            {daChot ? 'Chốt lại' : 'Chốt'}
          </Button>
        </div>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        Bỏ trống = 0. Chỉ phiếu <strong>đã chốt</strong> mới được dùng làm tồn đầu / tồn cuối khi tính lãi lỗ.
      </p>
    </div>
  );
}
