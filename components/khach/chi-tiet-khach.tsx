'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { DonHang, DonHangCt, KhachHang } from '@/lib/types';
import { ngayDay, tien, truoc } from '@/lib/format';
import { donCuaKhach, suaKhach } from '@/lib/queries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

export function ChiTietKhach({
  khach,
  onDong,
  onDaSua,
}: {
  khach: KhachHang | null;
  onDong: () => void;
  onDaSua: (k: KhachHang) => void;
}) {
  const [don, setDon] = useState<(DonHang & { don_hang_ct: DonHangCt[] })[]>([]);
  const [dangTai, setDangTai] = useState(false);
  const [sua, setSua] = useState(false);
  const [ten, setTen] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (!khach) return;
    setSua(false);
    setTen(khach.ten);
    setDiaChi(khach.dia_chi ?? '');
    setGhiChu(khach.ghi_chu ?? '');
    setDangTai(true);
    donCuaKhach(khach.id, 30)
      .then(setDon)
      .catch(() => setDon([]))
      .finally(() => setDangTai(false));
  }, [khach]);

  if (!khach) return null;

  const dem = new Map<string, number>();
  for (const d of don) {
    for (const ct of d.don_hang_ct ?? []) {
      dem.set(ct.ten_mon, (dem.get(ct.ten_mon) ?? 0) + Number(ct.so_luong));
    }
  }
  const topMon = Array.from(dem.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const tbDon = Number(khach.tong_don) > 0 ? Number(khach.tong_tien) / Number(khach.tong_don) : 0;

  async function luu() {
    if (!khach) return;
    setDangLuu(true);
    try {
      const thayDoi = {
        ten: ten.trim() || khach.ten,
        dia_chi: diaChi.trim() || null,
        ghi_chu: ghiChu.trim() || null,
      };
      await suaKhach(khach.id, thayDoi);
      onDaSua({ ...khach, ...thayDoi });
      setSua(false);
      toastOk('Đã lưu thông tin khách');
    } catch (e) {
      toastLoi('Chưa lưu được', e instanceof Error ? e.message : String(e));
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <Dialog open={khach !== null} onOpenChange={(m) => !m && onDong()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{khach.ten}</DialogTitle>
          <DialogDescription>
            {khach.sdt} · {khach.dia_chi || 'chưa có địa chỉ'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <O nhan="Tổng đơn" giaTri={String(khach.tong_don)} />
          <O nhan="Tổng tiền" giaTri={tien(khach.tong_tien)} />
          <O nhan="TB / đơn" giaTri={tien(tbDon)} />
        </div>

        <p className="text-sm text-text-2">
          Lần cuối đặt: <span className="font-semibold text-foreground">{truoc(khach.lan_cuoi_dat)}</span>
        </p>

        {topMon.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-text-2">
              Hay đặt nhất
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topMon.map(([ten_, so]) => (
                <Badge key={ten_} variant="secondary">
                  {ten_} · {so} suất
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sua ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="k-ten">Tên</Label>
              <Input id="k-ten" value={ten} onChange={(e) => setTen(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="k-dc">Địa chỉ</Label>
              <Input id="k-dc" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="k-gc">Ghi chú</Label>
              <Input
                id="k-gc"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Không ăn cay, giao trước 11h…"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSua(false)} className="flex-1">
                Huỷ
              </Button>
              <Button onClick={luu} disabled={dangLuu} className="flex-1">
                {dangLuu && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          <>
            {khach.ghi_chu && (
              <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">{khach.ghi_chu}</p>
            )}
            <Button variant="outline" onClick={() => setSua(true)} className="w-full">
              Sửa thông tin
            </Button>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-text-2">
            Lịch sử đơn
          </span>
          {dangTai ? (
            <p className="flex items-center gap-2 py-3 text-sm text-text-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải…
            </p>
          ) : don.length === 0 ? (
            <p className="py-3 text-sm text-text-2">Chưa có đơn nào.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {don.map((d) => (
                <div key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="tabular w-20 shrink-0 text-text-2">{ngayDay(d.ngay)}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {(d.don_hang_ct ?? []).map((c) => c.ten_mon).join(', ') || '—'}
                  </span>
                  <span className="tabular shrink-0 font-bold">{tien(d.tong_thanh_toan)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function O({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-surface-2 px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-2">{nhan}</span>
      <span className="tabular truncate font-bold">{giaTri}</span>
    </div>
  );
}
