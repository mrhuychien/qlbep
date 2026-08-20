'use client';

import { useState } from 'react';
import { CopyPlus, Loader2, Plus, Trash2 } from 'lucide-react';
import type { ChiPhiKhac, LoaiChiPhi } from '@/lib/types';
import { LOAI_CHI_PHI_LABEL } from '@/lib/types';
import { docSoTien, homNay, ngayDay, tien } from '@/lib/format';
import { lapLaiChiPhiThangTruoc, themChiPhiKhac, xoaChiPhiKhac } from '@/lib/queries';
import { thangTruocCua, type Ky } from '@/lib/ky';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trong } from '@/components/trang-thai';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

const LOAI: LoaiChiPhi[] = [
  'gas',
  'dien_nuoc',
  'luong',
  'mat_bang',
  'xang_xe',
  'bao_bi',
  'thue_phi',
  'khac',
];

export function FormChiPhi({
  bepId,
  ky,
  ds,
  onTaiLai,
}: {
  bepId: string;
  ky: Ky;
  ds: ChiPhiKhac[];
  onTaiLai: () => void;
}) {
  const [loai, setLoai] = useState<LoaiChiPhi>('gas');
  const [dienGiai, setDienGiai] = useState('');
  const [soTien, setSoTien] = useState('');
  const [ngay, setNgay] = useState(homNay());
  const [dangLuu, setDangLuu] = useState(false);
  const [dangChep, setDangChep] = useState(false);

  async function them() {
    const t = docSoTien(soTien);
    if (t <= 0) return;
    setDangLuu(true);
    try {
      await themChiPhiKhac(bepId, { ngay, loai, dien_giai: dienGiai.trim() || null, so_tien: t });
      setSoTien('');
      setDienGiai('');
      onTaiLai();
      toastOk('Đã ghi chi phí');
    } catch (e) {
      toastLoi('Chưa ghi được', e instanceof Error ? e.message : String(e));
    } finally {
      setDangLuu(false);
    }
  }

  async function chepThangTruoc() {
    setDangChep(true);
    try {
      const tt = thangTruocCua(ky);
      const so = await lapLaiChiPhiThangTruoc(bepId, tt.tu, tt.den, homNay());
      if (so === 0) toastOk('Tháng trước không có khoản nào để chép');
      else toastOk(`Đã chép ${so} khoản từ tháng trước`);
      onTaiLai();
    } catch (e) {
      toastLoi('Chưa chép được', e instanceof Error ? e.message : String(e));
    } finally {
      setDangChep(false);
    }
  }

  const tong = ds.reduce((s, c) => s + Number(c.so_tien), 0);

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-2 p-3">
        <div className="flex gap-2">
          <select
            value={loai}
            onChange={(e) => setLoai(e.target.value as LoaiChiPhi)}
            aria-label="Loại chi phí"
            className="h-tap min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LOAI.map((l) => (
              <option key={l} value={l}>
                {LOAI_CHI_PHI_LABEL[l]}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={ngay}
            onChange={(e) => setNgay(e.target.value)}
            aria-label="Ngày chi"
            className="w-36 shrink-0"
          />
        </div>

        <Input
          value={dienGiai}
          onChange={(e) => setDienGiai(e.target.value)}
          placeholder="Diễn giải (không bắt buộc)"
          aria-label="Diễn giải"
        />

        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="numeric"
            value={soTien}
            onChange={(e) => setSoTien(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void them();
              }
            }}
            placeholder="Số tiền"
            aria-label="Số tiền"
            className="tabular min-w-0 flex-1 text-right"
          />
          <Button onClick={them} disabled={dangLuu || docSoTien(soTien) <= 0} size="icon" className="shrink-0" aria-label="Ghi chi phí">
            {dangLuu ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          </Button>
        </div>

        <Button variant="outline" onClick={chepThangTruoc} disabled={dangChep} className="w-full">
          {dangChep ? <Loader2 className="h-5 w-5 animate-spin" /> : <CopyPlus className="h-5 w-5" />}
          Lặp lại tháng trước
        </Button>
      </Card>

      {ds.length === 0 ? (
        <Trong tieuDe="Chưa ghi chi phí nào trong kỳ" moTa="Gas, điện nước, lương, mặt bằng, bao bì…" />
      ) : (
        <Card className="divide-y divide-border">
          {ds.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {LOAI_CHI_PHI_LABEL[c.loai]}
                  {c.dien_giai && <span className="font-normal text-text-2"> · {c.dien_giai}</span>}
                </p>
                <p className="tabular text-xs text-text-2">{ngayDay(c.ngay)}</p>
              </div>
              <span className="tabular shrink-0 font-bold">{tien(c.so_tien)}</span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await xoaChiPhiKhac(c.id);
                    onTaiLai();
                  } catch (e) {
                    toastLoi('Chưa xoá được', e instanceof Error ? e.message : String(e));
                  }
                }}
                aria-label={`Xoá khoản ${LOAI_CHI_PHI_LABEL[c.loai]} ${tien(c.so_tien)}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      )}

      <div className="flex items-baseline justify-between rounded-lg bg-surface-2 px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-text-2">Tổng kỳ</span>
        <span className="tabular text-xl font-bold">{tien(tong)}</span>
      </div>
    </div>
  );
}
