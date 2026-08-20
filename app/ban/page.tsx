'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Zap } from 'lucide-react';
import { useBep } from '@/lib/bep-context';
import { docSoTien, homNay, ngayCoThu } from '@/lib/format';
import {
  donCuaKhach,
  layKhachHang,
  layThucDonNgay,
  taoDonHang,
  taoKhach,
  timKhachTheoSdt,
  type DongDonLuu,
} from '@/lib/queries';
import type { KenhDat, KhachHang, ThucDonNgay } from '@/lib/types';
import { DangTaiThe, Loi, Trong } from '@/components/trang-thai';
import { ViewBanner } from '@/components/npp/view-banner';
import { useTaiLaiKhiBam } from '@/lib/tai-lai';
import { TimKhach, type KhachChon } from '@/components/ban/tim-khach';
import { LuoiMon } from '@/components/ban/luoi-mon';
import { TomTatDon } from '@/components/ban/tom-tat-don';
import { Button } from '@/components/ui/button';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

export default function BanPage() {
  const { bepId } = useBep();
  const ngay = homNay();

  const [thucDon, setThucDon] = useState<ThucDonNgay[]>([]);
  const [khachDs, setKhachDs] = useState<KhachHang[]>([]);
  const [khach, setKhach] = useState<KhachChon | null>(null);
  const [hayDat, setHayDat] = useState<string[]>([]);
  const [soLuong, setSoLuong] = useState<Record<string, number>>({});
  const [ship, setShip] = useState('0');
  const [kenh, setKenh] = useState<KenhDat>('zalo');
  const [daThu, setDaThu] = useState(true);
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    if (!bepId) return;
    setDangTai(true);
    setLoi(null);
    try {
      const [td, kh] = await Promise.all([layThucDonNgay(bepId, ngay), layKhachHang(bepId)]);
      setThucDon(td);
      setKhachDs(kh);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [bepId, ngay]);

  useEffect(() => {
    void tai();
  }, [tai]);
  useTaiLaiKhiBam(tai);

  async function chonKhach(k: KhachChon) {
    setKhach(k);
    setHayDat([]);
    if (!k.khach_hang_id) return;
    try {
      const don = await donCuaKhach(k.khach_hang_id, 20);
      const dem = new Map<string, number>();
      for (const d of don) {
        for (const ct of d.don_hang_ct ?? []) {
          dem.set(ct.ten_mon, (dem.get(ct.ten_mon) ?? 0) + Number(ct.so_luong));
        }
      }
      setHayDat(
        Array.from(dem.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([ten]) => ten),
      );
    } catch {
      setHayDat([]); // không có gợi ý cũng không sao, đừng chặn việc bán
    }
  }

  function doiSo(thucDonId: string, so: number) {
    setSoLuong((p) => {
      const moi = { ...p };
      if (so <= 0) delete moi[thucDonId];
      else moi[thucDonId] = so;
      return moi;
    });
  }

  function themNhanh(tenMon: string) {
    const t = thucDon.find((x) => x.ten_mon === tenMon);
    if (!t) return;
    doiSo(t.id, (soLuong[t.id] ?? 0) + 1);
  }

  function lamMoi() {
    setKhach(null);
    setHayDat([]);
    setSoLuong({});
    setShip('0');
    setKenh('zalo');
    setDaThu(true);
  }

  const dongDon: DongDonLuu[] = Object.entries(soLuong)
    .map(([id, so]) => {
      const t = thucDon.find((x) => x.id === id);
      if (!t) return null;
      return { thuc_don_id: t.id, ten_mon: t.ten_mon, so_luong: so, don_gia: Number(t.gia_ban) };
    })
    .filter((x): x is DongDonLuu => x !== null);

  const tongHang = dongDon.reduce((s, d) => s + d.so_luong * d.don_gia, 0);

  async function luu() {
    if (!bepId || dongDon.length === 0) return;
    setDangLuu(true);
    try {
      let khachId = khach?.khach_hang_id ?? null;

      // Khách mới có SĐT → tạo hồ sơ để lần sau gõ 3 số cuối là ra
      if (!khachId && khach && !khach.vangLai && khach.sdt) {
        const daCo = await timKhachTheoSdt(bepId, khach.sdt);
        khachId = daCo
          ? daCo.id
          : (await taoKhach(bepId, khach.sdt, khach.ten, khach.dia_chi ?? undefined)).id;
      }

      await taoDonHang(
        bepId,
        {
          ngay,
          khach_hang_id: khachId,
          ten_khach: khach?.ten ?? null,
          sdt_khach: khach?.sdt ?? null,
          dia_chi_giao: khach?.dia_chi ?? null,
          kenh_dat: kenh,
          phi_ship_thu_khach: docSoTien(ship),
          da_thu: daThu,
        },
        dongDon,
      );

      toastOk(
        `Đã lưu đơn ${khach?.ten ?? 'khách lẻ'}`,
        daThu ? undefined : 'Đơn này chưa thu tiền.',
      );
      lamMoi();
      await tai(); // cập nhật lại số suất còn
    } catch (e) {
      toastLoi('Chưa lưu được đơn', e instanceof Error ? e.message : String(e));
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ViewBanner
        tieuDe={khach?.ten ?? 'Đơn mới'}
        phu={khach ? [khach.sdt, khach.dia_chi].filter(Boolean).join(' · ') || 'Khách lẻ' : ngayCoThu(ngay)}
        badge={dongDon.length > 0 ? `${dongDon.length} món` : undefined}
      />

      {loi && <Loi loi={loi} thuLai={tai} />}

      <TimKhach ds={khachDs} chon={khach} onChon={chonKhach} onBo={() => setKhach(null)} />

      {hayDat.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-text-2">
            <Zap className="h-3.5 w-3.5" />
            Hay đặt
          </span>
          {hayDat.map((ten) => {
            const co = thucDon.some((t) => t.ten_mon === ten);
            return (
              <button
                key={ten}
                type="button"
                disabled={!co}
                onClick={() => themNhanh(ten)}
                title={co ? undefined : 'Hôm nay không nấu món này'}
                className="h-9 rounded-full border border-border bg-card px-3 text-sm font-semibold transition-colors active:bg-surface-2 disabled:opacity-40"
              >
                {ten}
              </button>
            );
          })}
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-2">
          Chọn món — chạm để +1
        </h2>
        {dangTai ? (
          <DangTaiThe so={2} cao="h-24" />
        ) : thucDon.length === 0 ? (
          <Trong
            icon={<UtensilsCrossed className="h-8 w-8" />}
            tieuDe="Hôm nay chưa có thực đơn"
            moTa="Chốt hôm nay nấu món gì trước rồi mới nhận đơn được."
            hanhDong={
              <Button asChild>
                <Link href="/menu">Lên thực đơn</Link>
              </Button>
            }
          />
        ) : (
          <LuoiMon ds={thucDon} soLuong={soLuong} onDoi={doiSo} />
        )}
      </section>

      {thucDon.length > 0 && (
        <TomTatDon
          tongHang={tongHang}
          ship={ship}
          setShip={setShip}
          kenh={kenh}
          setKenh={setKenh}
          daThu={daThu}
          setDaThu={setDaThu}
          dangLuu={dangLuu}
          coTheLuu={dongDon.length > 0}
          onLuu={luu}
        />
      )}
    </div>
  );
}
