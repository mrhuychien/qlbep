'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { KhachHang } from '@/lib/types';
import { chuanSdt } from '@/lib/format';
import { taoKhach, timKhachTheoSdt } from '@/lib/queries';
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
import { toastLoi, toastOk } from '@/components/ui/use-toast';

/**
 * Khách vẫn được tạo tự động khi ghi đơn có số điện thoại. Form này cho lúc
 * chủ bếp muốn lưu sẵn khách trước khi họ đặt (gặp ngoài chợ, người quen giới
 * thiệu…) mà chưa có đơn nào.
 */
export function ThemKhach({
  mo,
  setMo,
  bepId,
  onXong,
}: {
  mo: boolean;
  setMo: (v: boolean) => void;
  bepId: string;
  onXong: (k: KhachHang) => void;
}) {
  const [sdt, setSdt] = useState('');
  const [ten, setTen] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  function dong() {
    setSdt('');
    setTen('');
    setDiaChi('');
    setMo(false);
  }

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    const so = chuanSdt(sdt);
    if (!so || !ten.trim()) return;

    setDangLuu(true);
    try {
      // Số điện thoại là duy nhất trong một bếp — báo trước cho rõ ràng thay vì
      // để Postgres ném lỗi trùng khoá khó hiểu
      const daCo = await timKhachTheoSdt(bepId, so);
      if (daCo) {
        toastLoi('Số này đã có trong sổ', `${daCo.ten} — ${daCo.sdt}`);
        return;
      }
      const k = await taoKhach(bepId, so, ten.trim(), diaChi.trim() || undefined);
      toastOk(`Đã thêm ${k.ten}`);
      onXong(k);
      dong();
    } catch (err) {
      toastLoi('Chưa thêm được khách', err instanceof Error ? err.message : String(err));
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <Dialog open={mo} onOpenChange={(v) => (v ? setMo(true) : dong())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm khách hàng</DialogTitle>
          <DialogDescription>
            Khách đặt qua app sẽ tự được lưu. Form này để lưu sẵn khách chưa có đơn nào.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={luu} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="k-sdt">Số điện thoại *</Label>
            <Input
              id="k-sdt"
              type="tel"
              inputMode="tel"
              value={sdt}
              onChange={(e) => setSdt(e.target.value)}
              placeholder="0912345678"
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="k-ten-moi">Tên *</Label>
            <Input
              id="k-ten-moi"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              placeholder="Chị Lan"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="k-dc-moi">Địa chỉ giao</Label>
            <Input
              id="k-dc-moi"
              value={diaChi}
              onChange={(e) => setDiaChi(e.target.value)}
              placeholder="Ngõ 5 Lê Lợi"
            />
          </div>

          <Button type="submit" disabled={dangLuu || !chuanSdt(sdt) || !ten.trim()} className="w-full">
            {dangLuu && <Loader2 className="h-4 w-4 animate-spin" />}
            {dangLuu ? 'Đang lưu…' : 'Lưu khách'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
