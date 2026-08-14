'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { useBep } from '@/lib/bep-context';
import { gio, homNay, tien } from '@/lib/format';
import { layDonHangNgay, layThucDonNgay, layTongChoNgay, type DonHangKemMon } from '@/lib/queries';
import type { ThucDonNgay } from '@/lib/types';
import { ChonNgay } from '@/components/chon-ngay';
import { TaiKhoan } from '@/components/tai-khoan';
import { DangTaiThe, Loi, Trong } from '@/components/trang-thai';
import { ThongKeNgay } from '@/components/hom-nay/thong-ke-ngay';
import { ThucDonHomNay } from '@/components/hom-nay/thuc-don-hom-nay';
import { ChotCuoiNgay } from '@/components/hom-nay/chot-cuoi-ngay';
import { Card } from '@/components/ui/card';

export default function HomNayPage() {
  const { bepId, bep } = useBep();
  const [ngay, setNgay] = useState(homNay());
  const [thucDon, setThucDon] = useState<ThucDonNgay[]>([]);
  const [don, setDon] = useState<DonHangKemMon[]>([]);
  const [chiCho, setChiCho] = useState(0);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    if (!bepId) return;
    setDangTai(true);
    setLoi(null);
    try {
      const [td, dh, cc] = await Promise.all([
        layThucDonNgay(bepId, ngay),
        layDonHangNgay(bepId, ngay),
        layTongChoNgay(bepId, ngay),
      ]);
      setThucDon(td);
      setDon(dh);
      setChiCho(cc);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [bepId, ngay]);

  useEffect(() => {
    void tai();
  }, [tai]);

  const doanhThu = don.reduce((s, d) => s + Number(d.tong_thanh_toan ?? 0), 0);
  const chuaChot = thucDon.length > 0 && thucDon.some((t) => !t.da_chot);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-1">
        <ChonNgay ngay={ngay} doiNgay={setNgay} className="min-w-0 flex-1" />
        <TaiKhoan />
      </header>

      {bep && <p className="-mt-2 text-center text-xs font-semibold text-muted-foreground">{bep.ten}</p>}

      {loi && <Loi loi={loi} thuLai={tai} />}

      {dangTai ? (
        <DangTaiThe so={3} cao="h-24" />
      ) : (
        <>
          <ThongKeNgay doanhThu={doanhThu} chiCho={chiCho} />

          <section className="flex flex-col gap-2">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Thực đơn {ngay === homNay() ? 'hôm nay' : 'ngày này'}
            </h2>
            <ThucDonHomNay ds={thucDon} ngay={ngay} />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Đơn gần nhất
            </h2>
            {don.length === 0 ? (
              <Trong
                icon={<Receipt className="h-8 w-8" />}
                tieuDe="Chưa có đơn nào"
                moTa={
                  ngay === homNay()
                    ? 'Khách gọi thì bấm nút + Đơn ở dưới để ghi.'
                    : 'Ngày này không ghi nhận đơn nào.'
                }
              />
            ) : (
              <Card className="divide-y divide-border">
                {don.slice(0, 8).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3">
                    <span className="tabular w-12 shrink-0 text-sm font-semibold text-muted-foreground">
                      {gio(d.created_at)}
                    </span>
                    <span className="flex-1 truncate font-semibold">
                      {d.ten_khach || 'Khách lẻ'}
                      {!d.da_thu && (
                        <span className="ml-1.5 text-xs font-bold text-warning">chưa thu</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {d.don_hang_ct?.length ?? 0} món
                    </span>
                    <span className="tabular w-20 shrink-0 text-right font-bold">
                      {tien(d.tong_thanh_toan)}
                    </span>
                  </div>
                ))}
                {don.length > 8 && (
                  <Link
                    href="/so-sach"
                    className="block p-3 text-center text-sm font-semibold text-primary"
                  >
                    Xem hết {don.length} đơn
                  </Link>
                )}
              </Card>
            )}
          </section>

          {chuaChot && <ChotCuoiNgay ds={thucDon} onXong={tai} />}
        </>
      )}
    </div>
  );
}
