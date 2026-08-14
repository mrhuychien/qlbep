'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { useBep } from '@/lib/bep-context';
import { ngayDay, phanTram } from '@/lib/format';
import { KY_NHAN, tinhKy, type Ky, type MaKy } from '@/lib/ky';
import {
  doanhThuChiPhiTheoNgay,
  layChiPhiKhac,
  layGiaVonMon,
  layPnl,
  layWaste,
} from '@/lib/queries';
import type { ChiPhiKhac, GiaVonMonNgay, Pnl, WasteMon } from '@/lib/types';
import { DangTaiThe, Loi, Trong } from '@/components/trang-thai';
import { BaoCaoPnl } from '@/components/so-sach/bao-cao-pnl';
import { BieuDoDoanhThu, BieuDoTopMon, BieuDoWaste } from '@/components/so-sach/bieu-do';
import { FormChiPhi } from '@/components/so-sach/form-chi-phi';
import { BangKiemKe } from '@/components/so-sach/bang-kiem-ke';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const NGUONG_LO = 45; // food cost % — trên mức này là món ăn lỗ
const NGUONG_E = 20; // % dư trung bình — trên mức này là món hay ế
const SO_LAN_XET_E = 7;

const CAC_KY: MaKy[] = ['thang_nay', 'thang_truoc', 'tuan_nay', 'tuy_chon'];

export default function SoSachPage() {
  const { bepId } = useBep();
  const [maKy, setMaKy] = useState<MaKy>('thang_nay');
  const [ky, setKy] = useState<Ky>(() => tinhKy('thang_nay'));

  const [pnl, setPnl] = useState<Pnl | null>(null);
  const [giaVon, setGiaVon] = useState<GiaVonMonNgay[]>([]);
  const [waste, setWaste] = useState<WasteMon[]>([]);
  const [theoNgay, setTheoNgay] = useState<{ ngay: string; doanh_thu: number; chi_cho: number }[]>([]);
  const [chiPhi, setChiPhi] = useState<ChiPhiKhac[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    if (!bepId) return;
    setDangTai(true);
    setLoi(null);
    try {
      const [p, gv, w, tn, cp] = await Promise.all([
        layPnl(bepId, ky.tu, ky.den),
        layGiaVonMon(bepId, ky.tu, ky.den),
        layWaste(bepId, ky.tu, ky.den),
        doanhThuChiPhiTheoNgay(bepId, ky.tu, ky.den),
        layChiPhiKhac(bepId, ky.tu, ky.den),
      ]);
      setPnl(p);
      setGiaVon(gv);
      setWaste(w);
      setTheoNgay(tn);
      setChiPhi(cp);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [bepId, ky]);

  useEffect(() => {
    void tai();
  }, [tai]);

  function doiKy(ma: MaKy) {
    setMaKy(ma);
    if (ma !== 'tuy_chon') setKy(tinhKy(ma));
  }

  // Top 10 món theo lãi = (giá bán − giá vốn/suất) × số suất đã bán
  const topMon = useMemo(() => {
    const gom = new Map<string, { ten: string; lai: number }>();
    for (const g of giaVon) {
      if (g.gia_von_suat === null || g.gia_ban === null) continue;
      const lai = (Number(g.gia_ban) - Number(g.gia_von_suat)) * Number(g.sl_ban ?? 0);
      const cu = gom.get(g.mon_an_id) ?? { ten: g.ten_mon ?? '—', lai: 0 };
      gom.set(g.mon_an_id, { ten: cu.ten, lai: cu.lai + lai });
    }
    return Array.from(gom.values())
      .sort((a, b) => b.lai - a.lai)
      .slice(0, 10);
  }, [giaVon]);

  // Tiền đổ đi theo món (gộp cả kỳ), chỉ lấy món thật sự có dư
  const topWaste = useMemo(() => {
    const gom = new Map<string, { ten: string; tien_do_di: number }>();
    for (const w of waste) {
      const cu = gom.get(w.mon_an_id) ?? { ten: w.ten_mon, tien_do_di: 0 };
      gom.set(w.mon_an_id, { ten: cu.ten, tien_do_di: cu.tien_do_di + Number(w.tien_do_di ?? 0) });
    }
    return Array.from(gom.values())
      .filter((x) => x.tien_do_di > 0)
      .sort((a, b) => b.tien_do_di - a.tien_do_di)
      .slice(0, 10);
  }, [waste]);

  // Món ăn lỗ: gộp cả kỳ rồi tính food cost — một ngày lẻ đắt hàng không kết tội cả món
  const monLo = useMemo(() => {
    const gom = new Map<string, { ten: string; cp: number; dt: number }>();
    for (const g of giaVon) {
      if (g.gia_ban === null || g.sl_du_kien === null) continue;
      const cp = Number(g.cp_truc_tiep) + Number(g.cp_phan_bo ?? 0);
      const dt = Number(g.sl_du_kien) * Number(g.gia_ban);
      const cu = gom.get(g.mon_an_id) ?? { ten: g.ten_mon ?? '—', cp: 0, dt: 0 };
      gom.set(g.mon_an_id, { ten: cu.ten, cp: cu.cp + cp, dt: cu.dt + dt });
    }
    return Array.from(gom.values())
      .filter((x) => x.dt > 0)
      .map((x) => ({ ten: x.ten, pct: (x.cp / x.dt) * 100 }))
      .filter((x) => x.pct > NGUONG_LO)
      .sort((a, b) => b.pct - a.pct);
  }, [giaVon]);

  // Món hay ế: tỷ lệ dư trung bình của tối đa 7 lần nấu gần nhất
  const monE = useMemo(() => {
    const gom = new Map<string, WasteMon[]>();
    for (const w of waste) {
      const ds = gom.get(w.mon_an_id) ?? [];
      ds.push(w);
      gom.set(w.mon_an_id, ds);
    }
    return Array.from(gom.values())
      .map((ds) => {
        const gan = [...ds].sort((a, b) => b.ngay.localeCompare(a.ngay)).slice(0, SO_LAN_XET_E);
        const tb = gan.reduce((s, w) => s + Number(w.ty_le_du_pct ?? 0), 0) / gan.length;
        return { ten: gan[0].ten_mon, pct: tb, soLan: gan.length };
      })
      .filter((x) => x.pct > NGUONG_E)
      .sort((a, b) => b.pct - a.pct);
  }, [waste]);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-bold">Sổ sách</h1>

      <Tabs defaultValue="lai-lo">
        <TabsList>
          <TabsTrigger value="lai-lo">Lãi lỗ</TabsTrigger>
          <TabsTrigger value="chi-phi">Chi phí khác</TabsTrigger>
          <TabsTrigger value="kiem-ke">Kiểm kê</TabsTrigger>
        </TabsList>

        {/* ── LÃI LỖ ── */}
        <TabsContent value="lai-lo" className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {CAC_KY.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => doiKy(m)}
                className={cn(
                  'h-10 rounded-full border px-3.5 text-sm font-bold transition-colors',
                  maKy === m
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {KY_NHAN[m]}
              </button>
            ))}
          </div>

          {maKy === 'tuy_chon' ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={ky.tu}
                onChange={(e) => e.target.value && setKy((p) => ({ ...p, tu: e.target.value }))}
                aria-label="Từ ngày"
                className="min-w-0 flex-1"
              />
              <span className="shrink-0 text-sm text-muted-foreground">đến</span>
              <Input
                type="date"
                value={ky.den}
                onChange={(e) => e.target.value && setKy((p) => ({ ...p, den: e.target.value }))}
                aria-label="Đến ngày"
                className="min-w-0 flex-1"
              />
            </div>
          ) : (
            <p className="px-1 text-xs text-muted-foreground">
              {ngayDay(ky.tu)} → {ngayDay(ky.den)}
            </p>
          )}

          {loi && <Loi loi={loi} thuLai={tai} />}

          {dangTai ? (
            <DangTaiThe so={3} cao="h-32" />
          ) : !pnl ? (
            <Trong tieuDe="Chưa có số liệu" moTa="Kỳ này chưa ghi nhận đơn hàng hay phiếu chợ nào." />
          ) : (
            <>
              <BaoCaoPnl pnl={pnl} />
              <BieuDoDoanhThu ds={theoNgay} />
              <BieuDoTopMon ds={topMon} />
              <BieuDoWaste ds={topWaste} />

              <BangCanhBao
                tieuDe="Món đang ăn lỗ"
                moTa={`Giá vốn chiếm hơn ${NGUONG_LO}% giá bán`}
                icon={<AlertTriangle className="h-4 w-4" />}
                ds={monLo.map((m) => ({ ten: m.ten, so: phanTram(m.pct) }))}
                khiTrong="Không có món nào vượt ngưỡng — giá vốn đang trong tầm kiểm soát."
              />

              <BangCanhBao
                tieuDe="Món hay ế"
                moTa={`Dư trung bình trên ${NGUONG_E}% trong ${SO_LAN_XET_E} lần nấu gần nhất`}
                icon={<TrendingDown className="h-4 w-4" />}
                ds={monE.map((m) => ({ ten: m.ten, so: phanTram(m.pct) }))}
                khiTrong="Không món nào dư đều — số suất đang nấu khá sát nhu cầu."
              />
            </>
          )}
        </TabsContent>

        {/* ── CHI PHÍ KHÁC ── */}
        <TabsContent value="chi-phi">
          {bepId && <FormChiPhi bepId={bepId} ky={ky} ds={chiPhi} onTaiLai={tai} />}
        </TabsContent>

        {/* ── KIỂM KÊ ── */}
        <TabsContent value="kiem-ke">{bepId && <BangKiemKe bepId={bepId} />}</TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Trạng thái BÌNH THƯỜNG cũng phải nói ra. Im lặng làm người dùng không phân
 * biệt được "đã kiểm, ổn" với "chưa tải xong".
 */
function BangCanhBao({
  tieuDe,
  moTa,
  icon,
  ds,
  khiTrong,
}: {
  tieuDe: string;
  moTa: string;
  icon: React.ReactNode;
  ds: { ten: string; so: string }[];
  khiTrong: string;
}) {
  const co = ds.length > 0;
  return (
    <Card className={cn('flex flex-col', co && 'border-danger/30')}>
      <div className="flex items-start gap-2 p-3 pb-2">
        <span className={co ? 'text-danger' : 'text-success'}>
          {co ? icon : <span className="text-base font-bold leading-none">✓</span>}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">{tieuDe}</h3>
          <p className="text-xs text-muted-foreground">{moTa}</p>
        </div>
      </div>

      {co ? (
        <div className="flex flex-col divide-y divide-border border-t border-border">
          {ds.map((x) => (
            <div key={x.ten} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{x.ten}</span>
              <span className="tabular shrink-0 font-bold text-danger">{x.so}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-3 pb-3 text-sm text-success-ink">{khiTrong}</p>
      )}
    </Card>
  );
}
