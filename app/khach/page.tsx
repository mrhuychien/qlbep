'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { HeartHandshake, Search, Users } from 'lucide-react';
import { useBep } from '@/lib/bep-context';
import { boDau, chuanSdt, khop } from '@/lib/format';
import { layKhachHang } from '@/lib/queries';
import type { KhachHang } from '@/lib/types';
import { DangTaiThe, Loi, Trong } from '@/components/trang-thai';
import { useTaiLaiKhiBam } from '@/lib/tai-lai';
import { DanhSachKhach } from '@/components/khach/danh-sach-khach';
import { ChiTietKhach } from '@/components/khach/chi-tiet-khach';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const DON_TOI_THIEU = 3;
const NGAY_IM_LANG = 30;

/** Khách quen (≥3 đơn) mà hơn 30 ngày không đặt — mất khách im lặng là mất doanh thu. */
function soNgayIm(k: KhachHang): number | null {
  if (!k.lan_cuoi_dat) return null;
  return differenceInCalendarDays(new Date(), parseISO(k.lan_cuoi_dat));
}

export default function KhachPage() {
  const { bepId } = useBep();
  const [ds, setDs] = useState<KhachHang[]>([]);
  const [tu, setTu] = useState('');
  const [xem, setXem] = useState<KhachHang | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    if (!bepId) return;
    setDangTai(true);
    setLoi(null);
    try {
      setDs(await layKhachHang(bepId));
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [bepId]);

  useEffect(() => {
    void tai();
  }, [tai]);
  useTaiLaiKhiBam(tai);

  const loc = useMemo(() => {
    const t = tu.trim();
    if (!t) return ds;
    const so = chuanSdt(t);
    return ds.filter(
      (k) =>
        khop(k.ten, t) ||
        (so.length >= 2 && chuanSdt(k.sdt).includes(so)) ||
        boDau(k.dia_chi ?? '').includes(boDau(t)),
    );
  }, [ds, tu]);

  const canChamSoc = useMemo(
    () =>
      ds
        .filter((k) => {
          const n = soNgayIm(k);
          return Number(k.tong_don) >= DON_TOI_THIEU && n !== null && n > NGAY_IM_LANG;
        })
        .sort((a, b) => (soNgayIm(b) ?? 0) - (soNgayIm(a) ?? 0)),
    [ds],
  );

  function capNhat(k: KhachHang) {
    setDs((p) => p.map((x) => (x.id === k.id ? k : x)));
    setXem(k);
  }

  return (
    <div className="flex flex-col gap-3">
      {loi && <Loi loi={loi} thuLai={tai} />}

      <Tabs defaultValue="tat-ca">
        <TabsList>
          <TabsTrigger value="tat-ca">Tất cả {ds.length > 0 && `(${ds.length})`}</TabsTrigger>
          <TabsTrigger value="cham-soc" className="gap-1.5">
            Cần chăm sóc
            {canChamSoc.length > 0 && <Badge variant="danger">{canChamSoc.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tat-ca" className="flex flex-col gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-2" />
            <Input
              value={tu}
              onChange={(e) => setTu(e.target.value)}
              placeholder="Tìm theo tên, SĐT, địa chỉ…"
              aria-label="Tìm khách"
              className="pl-10"
            />
          </div>

          {dangTai ? (
            <DangTaiThe so={5} cao="h-14" />
          ) : loc.length === 0 ? (
            <Trong
              icon={<Users className="h-8 w-8" />}
              tieuDe={tu ? 'Không tìm thấy khách nào' : 'Chưa có khách nào'}
              moTa={
                tu
                  ? 'Thử gõ 3 số cuối điện thoại.'
                  : 'Khách được lưu tự động khi bạn ghi đơn có số điện thoại.'
              }
            />
          ) : (
            <DanhSachKhach ds={loc} onXem={setXem} />
          )}
        </TabsContent>

        <TabsContent value="cham-soc" className="flex flex-col gap-2">
          <p className="px-1 text-xs text-text-2">
            Khách đã đặt từ {DON_TOI_THIEU} đơn trở lên nhưng hơn {NGAY_IM_LANG} ngày nay chưa quay lại.
          </p>

          {dangTai ? (
            <DangTaiThe so={4} cao="h-14" />
          ) : canChamSoc.length === 0 ? (
            <Trong
              icon={<HeartHandshake className="h-8 w-8" />}
              tieuDe="Không có ai cần gọi lại"
              moTa="Khách quen đều còn đặt đều trong 30 ngày qua."
            />
          ) : (
            <DanhSachKhach
              ds={canChamSoc}
              onXem={setXem}
              nhanPhu={(k) => {
                const n = soNgayIm(k);
                return n === null ? null : `${n} ngày chưa đặt`;
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      <ChiTietKhach khach={xem} onDong={() => setXem(null)} onDaSua={capNhat} />
    </div>
  );
}
