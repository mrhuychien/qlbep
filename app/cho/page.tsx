'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Save, ShoppingBasket } from 'lucide-react';
import { useBep } from '@/lib/bep-context';
import { supabase, BUCKET_ANH_CHO } from '@/lib/supabase';
import { docSoTien, homNay, tien } from '@/lib/format';
import {
  layNguyenLieu,
  layPhieuChoNgay,
  layThucDonNgay,
  luuPhieuCho,
  taoNguyenLieu,
  type DongChoLuu,
} from '@/lib/queries';
import { tuDongDay, xepHang } from '@/lib/offline-queue';
import type { NguyenLieu, ThucDonNgay } from '@/lib/types';
import { ChonNgay } from '@/components/chon-ngay';
import { DangTaiThe, Loi, Trong } from '@/components/trang-thai';
import { TimNguyenLieu } from '@/components/cho/tim-nguyen-lieu';
import { DongChoRow, type DongCho } from '@/components/cho/dong-cho';
import { BadgeOffline } from '@/components/cho/badge-offline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

/** Hỏng vì mạng (đáng im lặng xếp hàng) hay vì server từ chối (phải nói ra)? */
function laLoiMang(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return (
    e instanceof TypeError ||
    m.includes('mất sóng') ||
    m.includes('fetch') ||
    m.includes('network') ||
    m.includes('timeout')
  );
}

export default function ChoPage() {
  const { bepId } = useBep();
  const [ngay, setNgay] = useState(homNay());
  const [nguyenLieu, setNguyenLieu] = useState<NguyenLieu[]>([]);
  const [monHomNay, setMonHomNay] = useState<ThucDonNgay[]>([]);
  const [dong, setDong] = useState<DongCho[]>([]);
  const [anhDaCo, setAnhDaCo] = useState<string[]>([]);
  const [vuaThem, setVuaThem] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [dangTaiAnh, setDangTaiAnh] = useState(false);
  const [dangTao, setDangTao] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [banDau, setBanDau] = useState('');

  const oTim = useRef<HTMLInputElement>(null);
  const oAnh = useRef<HTMLInputElement>(null);

  const tai = useCallback(async () => {
    if (!bepId) return;
    setDangTai(true);
    setLoi(null);
    try {
      const [nl, td, phieu] = await Promise.all([
        layNguyenLieu(bepId),
        layThucDonNgay(bepId, ngay),
        layPhieuChoNgay(bepId, ngay),
      ]);
      setNguyenLieu(nl);
      setMonHomNay(td);
      setAnhDaCo(phieu?.anh_url ?? []);

      const banDo = new Map(nl.map((n) => [n.id, n]));
      const ds: DongCho[] = (phieu?.phieu_cho_ct ?? []).map((ct, i) => {
        const n = banDo.get(ct.nguyen_lieu_id);
        return {
          key: `co-${ct.id ?? i}`,
          nguyen_lieu_id: ct.nguyen_lieu_id,
          ten: n?.ten ?? 'Nguyên liệu đã xoá',
          dvt_cho: n?.dvt_cho ?? 'kg',
          gia_gan_nhat: n?.gia_gan_nhat ?? null,
          so_luong: String(Number(ct.so_luong)),
          don_gia: String(Math.round(Number(ct.don_gia))),
          thanh_tien: String(Math.round(Number(ct.thanh_tien))),
          neo: 'don_gia',
          mon_an_id: ct.mon_an_id,
        };
      });
      setDong(ds);
      setBanDau(JSON.stringify(ds));
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [bepId, ngay]);

  useEffect(() => {
    void tai();
  }, [tai]);

  // Có sóng lại thì tự đẩy hàng đợi
  useEffect(() => tuDongDay((kq) => toastOk(`Đã gửi ${kq.xong} phiếu chợ chờ sẵn`)), []);

  function themDong(nl: NguyenLieu) {
    const key = `moi-${Date.now()}`;
    setDong((p) => [
      ...p,
      {
        key,
        nguyen_lieu_id: nl.id,
        ten: nl.ten,
        dvt_cho: nl.dvt_cho,
        gia_gan_nhat: nl.gia_gan_nhat === null ? null : Number(nl.gia_gan_nhat),
        so_luong: '',
        // Gợi ý giá lần mua gần nhất — sửa đè được, không chặn
        don_gia: nl.gia_gan_nhat ? String(Math.round(Number(nl.gia_gan_nhat))) : '',
        thanh_tien: '',
        neo: 'don_gia',
        mon_an_id: null,
      },
    ]);
    setVuaThem(key);
  }

  async function taoMoi(ten: string) {
    if (!bepId) return;
    setDangTao(true);
    try {
      const nl = await taoNguyenLieu(bepId, ten);
      setNguyenLieu((p) => [...p, nl].sort((a, b) => a.ten.localeCompare(b.ten, 'vi')));
      themDong(nl);
    } catch (e) {
      toastLoi('Chưa tạo được nguyên liệu', e instanceof Error ? e.message : String(e));
    } finally {
      setDangTao(false);
    }
  }

  function veODau() {
    setVuaThem(null);
    oTim.current?.focus();
  }

  async function chonAnh(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length || !bepId) return;

    setDangTaiAnh(true);
    const duong: string[] = [];
    try {
      for (const f of files) {
        const duoi = f.name.split('.').pop() || 'jpg';
        const p = `${bepId}/${ngay}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${duoi}`;
        const { error } = await supabase.storage.from(BUCKET_ANH_CHO).upload(p, f, {
          contentType: f.type || 'image/jpeg',
          upsert: false,
        });
        if (error) throw new Error(error.message);
        duong.push(p);
      }
      // Ảnh cần mạng thật (upload file) nên không xếp hàng offline được —
      // lưu ngay vào phiếu để không mất.
      await luuPhieuCho(bepId, ngay, dungDeLuu(dong), duong);
      setAnhDaCo((p) => [...p, ...duong]);
      toastOk(`Đã lưu ${duong.length} ảnh giấy chợ`);
    } catch (err) {
      toastLoi(
        'Chưa tải được ảnh',
        `${err instanceof Error ? err.message : String(err)} — cần mạng để gửi ảnh, thử lại khi có sóng.`,
      );
    } finally {
      setDangTaiAnh(false);
    }
  }

  function dungDeLuu(ds: DongCho[]): DongChoLuu[] {
    return ds
      .map((d) => ({
        nguyen_lieu_id: d.nguyen_lieu_id,
        so_luong: Number(d.so_luong.replace(',', '.')) || 0,
        don_gia: docSoTien(d.don_gia),
        mon_an_id: d.mon_an_id,
      }))
      .filter((d) => d.so_luong > 0 && d.don_gia > 0);
  }

  async function luu() {
    if (!bepId) return;
    const goi = dungDeLuu(dong);
    const bo = dong.length - goi.length;
    const matSong = typeof navigator !== 'undefined' && !navigator.onLine;

    setDangLuu(true);
    try {
      if (matSong) throw new Error('Mất sóng');
      await luuPhieuCho(bepId, ngay, goi);
      setBanDau(JSON.stringify(dong));
      toastOk(
        `Đã lưu ${goi.length} dòng · ${tien(tongTien)}`,
        bo > 0 ? `${bo} dòng thiếu số lượng hoặc giá nên chưa tính.` : undefined,
      );
    } catch (e) {
      // Dù hỏng vì gì cũng KHÔNG để mất dữ liệu gõ tay giữa chợ
      await xepHang({ bepId, ngay, dong: goi });
      setBanDau(JSON.stringify(dong));

      if (matSong || laLoiMang(e)) {
        toastOk('Đã lưu vào máy', 'Chưa có sóng — có mạng lại sẽ tự gửi lên.');
      } else {
        // Server nhận được nhưng từ chối: nói thẳng lý do, đừng giả vờ thành công
        toastLoi(
          'Server chưa nhận — đã giữ trong máy',
          `${e instanceof Error ? e.message : String(e)}. Bấm “Gửi lại” ở khung vàng phía trên sau khi xử lý.`,
        );
      }
    } finally {
      setDangLuu(false);
    }
  }

  const tongTien = dong.reduce((s, d) => s + docSoTien(d.thanh_tien), 0);
  const daDoi = JSON.stringify(dong) !== banDau;
  const daChon = new Set(dong.map((d) => d.nguyen_lieu_id));

  return (
    <div className="flex flex-col gap-3 pb-4">
      <header className="flex items-center gap-2">
        <h1 className="shrink-0 text-lg font-bold">Ghi chợ</h1>
        <ChonNgay ngay={ngay} doiNgay={setNgay} className="flex-1" />
      </header>

      <BadgeOffline />
      {loi && <Loi loi={loi} thuLai={tai} />}

      <TimNguyenLieu
        ref={oTim}
        ds={nguyenLieu}
        daChon={daChon}
        onChon={themDong}
        onTaoMoi={taoMoi}
        dangTao={dangTao}
      />

      {dangTai ? (
        <DangTaiThe so={4} cao="h-20" />
      ) : dong.length === 0 ? (
        <Trong
          icon={<ShoppingBasket className="h-8 w-8" />}
          tieuDe="Chưa ghi dòng nào"
          moTa="Gõ tên nguyên liệu ở ô trên để thêm dòng đầu tiên."
        />
      ) : (
        <Card className="divide-y divide-border">
          {dong.map((d) => (
            <DongChoRow
              key={d.key}
              dong={d}
              monHomNay={monHomNay}
              tuDongFocus={d.key === vuaThem}
              onSua={(moi) => setDong((p) => p.map((x) => (x.key === moi.key ? moi : x)))}
              onXoa={() => setDong((p) => p.filter((x) => x.key !== d.key))}
              onXong={veODau}
            />
          ))}
        </Card>
      )}

      <div className="flex items-baseline justify-between rounded-xl bg-secondary px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Tổng</span>
        <span className="tabular text-2xl font-bold">{tien(tongTien)}</span>
      </div>

      <div className="flex gap-2">
        <input
          ref={oAnh}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={chonAnh}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => oAnh.current?.click()}
          disabled={dangTaiAnh}
          className="flex-1"
        >
          {dangTaiAnh ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          Ảnh giấy{anhDaCo.length > 0 && ` (${anhDaCo.length})`}
        </Button>

        <Button type="button" onClick={luu} disabled={dangLuu || !daDoi} className="flex-1">
          {dangLuu ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {daDoi ? 'Lưu' : 'Đã lưu'}
        </Button>
      </div>
    </div>
  );
}
