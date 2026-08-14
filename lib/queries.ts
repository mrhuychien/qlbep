// Toàn bộ lệnh gọi Supabase gom về đây. Component không tự gọi supabase.
import { supabase } from './supabase';
import type {
  ChiPhiKhac,
  DonHang,
  DonHangCt,
  GiaVonMonNgay,
  KhachHang,
  KiemKe,
  KiemKeCt,
  LoaiChiPhi,
  MonAn,
  NguyenLieu,
  PhieuCho,
  PhieuChoCt,
  Pnl,
  ThucDonNgay,
  WasteMon,
} from './types';

function nem(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ═══════════════ HÔM NAY ═══════════════

export async function layThucDonNgay(bepId: string, ngay: string): Promise<ThucDonNgay[]> {
  const { data, error } = await supabase
    .from('thuc_don_ngay')
    .select('*')
    .eq('bep_id', bepId)
    .eq('ngay', ngay)
    .order('thu_tu')
    .order('ten_mon');
  nem(error);
  return (data ?? []) as ThucDonNgay[];
}

export type DonHangKemMon = DonHang & { don_hang_ct: { so_luong: number }[] };

export async function layDonHangNgay(bepId: string, ngay: string): Promise<DonHangKemMon[]> {
  const { data, error } = await supabase
    .from('don_hang')
    .select('*, don_hang_ct(so_luong)')
    .eq('bep_id', bepId)
    .eq('ngay', ngay)
    .neq('trang_thai', 'huy')
    .order('created_at', { ascending: false });
  nem(error);
  return (data ?? []) as DonHangKemMon[];
}

/** Tổng tiền đi chợ trong ngày (cộng mọi phiếu chợ của ngày đó). */
export async function layTongChoNgay(bepId: string, ngay: string): Promise<number> {
  const { data, error } = await supabase
    .from('phieu_cho')
    .select('tong_tien')
    .eq('bep_id', bepId)
    .eq('ngay', ngay);
  nem(error);
  return (data ?? []).reduce((s, r) => s + Number(r.tong_tien ?? 0), 0);
}

/** Chốt cuối ngày: ghi số suất dư từng món rồi đánh dấu đã chốt. */
export async function chotCuoiNgay(dong: { id: string; sl_du: number }[]): Promise<void> {
  for (const d of dong) {
    const { error } = await supabase
      .from('thuc_don_ngay')
      .update({ sl_du: d.sl_du, da_chot: true })
      .eq('id', d.id);
    nem(error);
  }
}

// ═══════════════ NGUYÊN LIỆU ═══════════════

export async function layNguyenLieu(bepId: string): Promise<NguyenLieu[]> {
  const { data, error } = await supabase
    .from('nguyen_lieu')
    .select('*')
    .eq('bep_id', bepId)
    .eq('active', true)
    .order('ten');
  nem(error);
  return (data ?? []) as NguyenLieu[];
}

export async function taoNguyenLieu(
  bepId: string,
  ten: string,
  dvtCho = 'kg',
): Promise<NguyenLieu> {
  const { data, error } = await supabase
    .from('nguyen_lieu')
    .insert({ bep_id: bepId, ten: ten.trim(), dvt_cho: dvtCho, dvt_chuan: dvtCho })
    .select('*')
    .single();
  nem(error);
  return data as NguyenLieu;
}

// ═══════════════ GHI CHỢ ═══════════════

export type DongChoLuu = {
  nguyen_lieu_id: string;
  so_luong: number;
  don_gia: number;
  mon_an_id: string | null;
};

export async function layPhieuChoNgay(
  bepId: string,
  ngay: string,
): Promise<(PhieuCho & { phieu_cho_ct: PhieuChoCt[] }) | null> {
  const { data, error } = await supabase
    .from('phieu_cho')
    .select('*, phieu_cho_ct(*)')
    .eq('bep_id', bepId)
    .eq('ngay', ngay)
    .order('created_at')
    .limit(1);
  nem(error);
  const ds = (data ?? []) as (PhieuCho & { phieu_cho_ct: PhieuChoCt[] })[];
  return ds[0] ?? null;
}

/**
 * Ghi cả buổi chợ trong 1 lần: tạo phiếu nếu chưa có, thay toàn bộ dòng chi tiết.
 * Ghi đè (không cộng dồn) nên gửi lại nhiều lần vẫn ra một kết quả — điều kiện
 * bắt buộc để hàng đợi offline gửi lại được an toàn.
 */
export async function luuPhieuCho(
  bepId: string,
  ngay: string,
  dong: DongChoLuu[],
  anhUrl?: string[],
): Promise<string> {
  let phieu = await layPhieuChoNgay(bepId, ngay);

  if (!phieu) {
    const { data, error } = await supabase
      .from('phieu_cho')
      .insert({ bep_id: bepId, ngay })
      .select('*')
      .single();
    nem(error);
    phieu = { ...(data as PhieuCho), phieu_cho_ct: [] };
  }

  const phieuId = phieu.id;

  const { error: eXoa } = await supabase.from('phieu_cho_ct').delete().eq('phieu_id', phieuId);
  nem(eXoa);

  if (dong.length) {
    const { error: eThem } = await supabase.from('phieu_cho_ct').insert(
      dong.map((d) => ({
        bep_id: bepId,
        phieu_id: phieuId,
        nguyen_lieu_id: d.nguyen_lieu_id,
        so_luong: d.so_luong,
        don_gia: d.don_gia,
        mon_an_id: d.mon_an_id,
      })),
    );
    nem(eThem);
  }

  if (anhUrl?.length) {
    const { error: eAnh } = await supabase
      .from('phieu_cho')
      .update({ anh_url: [...(phieu.anh_url ?? []), ...anhUrl] })
      .eq('id', phieuId);
    nem(eAnh);
  }

  return phieuId;
}

// ═══════════════ MÓN ĂN + THỰC ĐƠN ═══════════════

export async function layMonAn(bepId: string): Promise<MonAn[]> {
  const { data, error } = await supabase
    .from('mon_an')
    .select('*')
    .eq('bep_id', bepId)
    .eq('active', true)
    .order('lan_cuoi_nau', { ascending: false, nullsFirst: false })
    .order('ten');
  nem(error);
  return (data ?? []) as MonAn[];
}

export async function taoMonAn(bepId: string, ten: string, giaBan?: number): Promise<MonAn> {
  const { data, error } = await supabase
    .from('mon_an')
    .insert({ bep_id: bepId, ten: ten.trim(), gia_ban_mac_dinh: giaBan ?? null })
    .select('*')
    .single();
  nem(error);
  return data as MonAn;
}

export async function themVaoThucDon(
  bepId: string,
  ngay: string,
  mon: MonAn,
  giaBan: number,
  slDuKien: number,
  thuTu: number,
): Promise<ThucDonNgay> {
  const { data, error } = await supabase
    .from('thuc_don_ngay')
    .insert({
      bep_id: bepId,
      ngay,
      mon_an_id: mon.id,
      ten_mon: mon.ten,
      gia_ban: giaBan,
      sl_du_kien: slDuKien,
      thu_tu: thuTu,
    })
    .select('*')
    .single();
  nem(error);
  return data as ThucDonNgay;
}

export async function suaThucDon(
  id: string,
  thayDoi: Partial<Pick<ThucDonNgay, 'gia_ban' | 'sl_du_kien' | 'thu_tu' | 'ghi_chu'>>,
): Promise<void> {
  const { error } = await supabase.from('thuc_don_ngay').update(thayDoi).eq('id', id);
  nem(error);
}

export async function xoaThucDon(id: string): Promise<void> {
  const { error } = await supabase.from('thuc_don_ngay').delete().eq('id', id);
  nem(error);
}

/** Gợi ý số suất: trung bình + xu hướng dư/hết của 3 lần nấu gần nhất. */
export async function lichSuMon(bepId: string, monAnId: string, soLan = 7): Promise<ThucDonNgay[]> {
  const { data, error } = await supabase
    .from('thuc_don_ngay')
    .select('*')
    .eq('bep_id', bepId)
    .eq('mon_an_id', monAnId)
    .order('ngay', { ascending: false })
    .limit(soLan);
  nem(error);
  return (data ?? []) as ThucDonNgay[];
}

/** Các ngày gần đây CÓ thực đơn — dùng cho "Sao chép từ ngày…". */
export async function ngayCoThucDon(bepId: string, truocNgay: string, gioiHan = 14): Promise<string[]> {
  const { data, error } = await supabase
    .from('thuc_don_ngay')
    .select('ngay')
    .eq('bep_id', bepId)
    .lt('ngay', truocNgay)
    .order('ngay', { ascending: false })
    .limit(gioiHan * 6);
  nem(error);
  const ds = Array.from(new Set((data ?? []).map((r) => r.ngay as string)));
  return ds.slice(0, gioiHan);
}

export async function saoChepThucDon(bepId: string, tuNgay: string, denNgay: string): Promise<number> {
  const nguon = await layThucDonNgay(bepId, tuNgay);
  if (!nguon.length) return 0;
  const dangCo = await layThucDonNgay(bepId, denNgay);
  const daCo = new Set(dangCo.map((t) => t.mon_an_id));
  const them = nguon.filter((t) => !daCo.has(t.mon_an_id));
  if (!them.length) return 0;

  const { error } = await supabase.from('thuc_don_ngay').insert(
    them.map((t, i) => ({
      bep_id: bepId,
      ngay: denNgay,
      mon_an_id: t.mon_an_id,
      ten_mon: t.ten_mon,
      gia_ban: t.gia_ban,
      sl_du_kien: t.sl_du_kien,
      thu_tu: dangCo.length + i,
    })),
  );
  nem(error);
  return them.length;
}

// ═══════════════ KHÁCH HÀNG ═══════════════

export async function layKhachHang(bepId: string): Promise<KhachHang[]> {
  const { data, error } = await supabase
    .from('khach_hang')
    .select('*')
    .eq('bep_id', bepId)
    .eq('active', true)
    .order('lan_cuoi_dat', { ascending: false, nullsFirst: false });
  nem(error);
  return (data ?? []) as KhachHang[];
}

export async function timKhachTheoSdt(bepId: string, sdt: string): Promise<KhachHang | null> {
  const { data, error } = await supabase
    .from('khach_hang')
    .select('*')
    .eq('bep_id', bepId)
    .eq('sdt', sdt)
    .limit(1);
  nem(error);
  return ((data ?? [])[0] as KhachHang) ?? null;
}

export async function taoKhach(
  bepId: string,
  sdt: string,
  ten: string,
  diaChi?: string,
): Promise<KhachHang> {
  const { data, error } = await supabase
    .from('khach_hang')
    .insert({ bep_id: bepId, sdt, ten, dia_chi: diaChi ?? null })
    .select('*')
    .single();
  nem(error);
  return data as KhachHang;
}

export async function suaKhach(
  id: string,
  thayDoi: Partial<Pick<KhachHang, 'ten' | 'dia_chi' | 'ghi_chu'>>,
): Promise<void> {
  const { error } = await supabase.from('khach_hang').update(thayDoi).eq('id', id);
  nem(error);
}

export async function donCuaKhach(khachId: string, gioiHan = 30): Promise<(DonHang & { don_hang_ct: DonHangCt[] })[]> {
  const { data, error } = await supabase
    .from('don_hang')
    .select('*, don_hang_ct(*)')
    .eq('khach_hang_id', khachId)
    .neq('trang_thai', 'huy')
    .order('ngay', { ascending: false })
    .limit(gioiHan);
  nem(error);
  return (data ?? []) as (DonHang & { don_hang_ct: DonHangCt[] })[];
}

// ═══════════════ ĐƠN HÀNG ═══════════════

export type DongDonLuu = {
  thuc_don_id: string;
  ten_mon: string;
  so_luong: number;
  don_gia: number;
};

export async function taoDonHang(
  bepId: string,
  don: {
    ngay: string;
    khach_hang_id: string | null;
    ten_khach: string | null;
    sdt_khach: string | null;
    dia_chi_giao: string | null;
    kenh_dat: DonHang['kenh_dat'];
    phi_ship_thu_khach: number;
    da_thu: boolean;
    ghi_chu?: string | null;
  },
  dong: DongDonLuu[],
): Promise<string> {
  const { data, error } = await supabase
    .from('don_hang')
    .insert({ bep_id: bepId, ...don })
    .select('id')
    .single();
  nem(error);
  const donId = (data as { id: string }).id;

  const { error: eCt } = await supabase.from('don_hang_ct').insert(
    dong.map((d) => ({
      bep_id: bepId,
      don_hang_id: donId,
      thuc_don_id: d.thuc_don_id,
      ten_mon: d.ten_mon,
      so_luong: d.so_luong,
      don_gia: d.don_gia,
    })),
  );
  if (eCt) {
    // Đơn không có dòng nào là rác — dọn luôn để không đẻ ra doanh thu 0 đồng
    await supabase.from('don_hang').delete().eq('id', donId);
    nem(eCt);
  }

  return donId;
}

export async function huyDonHang(id: string): Promise<void> {
  const { error } = await supabase.from('don_hang').update({ trang_thai: 'huy' }).eq('id', id);
  nem(error);
}

export async function chiTietDon(donId: string): Promise<DonHangCt[]> {
  const { data, error } = await supabase.from('don_hang_ct').select('*').eq('don_hang_id', donId);
  nem(error);
  return (data ?? []) as DonHangCt[];
}

// ═══════════════ SỔ SÁCH ═══════════════

export async function layPnl(bepId: string, tu: string, den: string): Promise<Pnl | null> {
  const { data, error } = await supabase.rpc('fn_pnl', { p_bep: bepId, p_tu: tu, p_den: den });
  nem(error);
  const ds = (data ?? []) as Pnl[];
  return ds[0] ?? null;
}

export async function layGiaVonMon(bepId: string, tu: string, den: string): Promise<GiaVonMonNgay[]> {
  const { data, error } = await supabase
    .from('v_gia_von_mon_ngay')
    .select('*')
    .eq('bep_id', bepId)
    .gte('ngay', tu)
    .lte('ngay', den);
  nem(error);
  return (data ?? []) as GiaVonMonNgay[];
}

export async function layWaste(bepId: string, tu: string, den: string): Promise<WasteMon[]> {
  const { data, error } = await supabase
    .from('v_waste_mon')
    .select('*')
    .eq('bep_id', bepId)
    .gte('ngay', tu)
    .lte('ngay', den);
  nem(error);
  return (data ?? []) as WasteMon[];
}

/** Doanh thu & chi chợ từng ngày trong kỳ — cho biểu đồ đường. */
export async function doanhThuChiPhiTheoNgay(
  bepId: string,
  tu: string,
  den: string,
): Promise<{ ngay: string; doanh_thu: number; chi_cho: number }[]> {
  const [dh, pc] = await Promise.all([
    supabase
      .from('don_hang')
      .select('ngay, tong_thanh_toan')
      .eq('bep_id', bepId)
      .gte('ngay', tu)
      .lte('ngay', den)
      .neq('trang_thai', 'huy'),
    supabase.from('phieu_cho').select('ngay, tong_tien').eq('bep_id', bepId).gte('ngay', tu).lte('ngay', den),
  ]);
  nem(dh.error);
  nem(pc.error);

  const map = new Map<string, { ngay: string; doanh_thu: number; chi_cho: number }>();
  const lay = (ngay: string) => {
    if (!map.has(ngay)) map.set(ngay, { ngay, doanh_thu: 0, chi_cho: 0 });
    return map.get(ngay)!;
  };
  for (const r of dh.data ?? []) lay(r.ngay as string).doanh_thu += Number(r.tong_thanh_toan ?? 0);
  for (const r of pc.data ?? []) lay(r.ngay as string).chi_cho += Number(r.tong_tien ?? 0);

  return Array.from(map.values()).sort((a, b) => a.ngay.localeCompare(b.ngay));
}

export async function layChiPhiKhac(bepId: string, tu: string, den: string): Promise<ChiPhiKhac[]> {
  const { data, error } = await supabase
    .from('chi_phi_khac')
    .select('*')
    .eq('bep_id', bepId)
    .gte('ngay', tu)
    .lte('ngay', den)
    .order('ngay', { ascending: false });
  nem(error);
  return (data ?? []) as ChiPhiKhac[];
}

export async function themChiPhiKhac(
  bepId: string,
  cp: { ngay: string; loai: LoaiChiPhi; dien_giai: string | null; so_tien: number },
): Promise<void> {
  const { error } = await supabase.from('chi_phi_khac').insert({ bep_id: bepId, ...cp });
  nem(error);
}

export async function xoaChiPhiKhac(id: string): Promise<void> {
  const { error } = await supabase.from('chi_phi_khac').delete().eq('id', id);
  nem(error);
}

/** Copy các khoản cố định của tháng trước sang tháng này. */
export async function lapLaiChiPhiThangTruoc(
  bepId: string,
  tuThangTruoc: string,
  denThangTruoc: string,
  ngayGhi: string,
): Promise<number> {
  const cu = await layChiPhiKhac(bepId, tuThangTruoc, denThangTruoc);
  if (!cu.length) return 0;
  const { error } = await supabase.from('chi_phi_khac').insert(
    cu.map((c) => ({
      bep_id: bepId,
      ngay: ngayGhi,
      loai: c.loai,
      dien_giai: c.dien_giai,
      so_tien: c.so_tien,
    })),
  );
  nem(error);
  return cu.length;
}

// ═══════════════ KIỂM KÊ ═══════════════

export async function layKiemKe(
  bepId: string,
  ngay: string,
): Promise<(KiemKe & { kiem_ke_ct: KiemKeCt[] }) | null> {
  const { data, error } = await supabase
    .from('kiem_ke')
    .select('*, kiem_ke_ct(*)')
    .eq('bep_id', bepId)
    .eq('ngay', ngay)
    .limit(1);
  nem(error);
  return ((data ?? [])[0] as KiemKe & { kiem_ke_ct: KiemKeCt[] }) ?? null;
}

export async function luuKiemKe(
  bepId: string,
  ngay: string,
  dong: { nguyen_lieu_id: string; so_luong: number; don_gia: number }[],
  chot: boolean,
): Promise<void> {
  let kk = await layKiemKe(bepId, ngay);
  if (!kk) {
    const { data, error } = await supabase
      .from('kiem_ke')
      .insert({ bep_id: bepId, ngay })
      .select('*')
      .single();
    nem(error);
    kk = { ...(data as KiemKe), kiem_ke_ct: [] };
  }

  const { error: eXoa } = await supabase.from('kiem_ke_ct').delete().eq('kiem_ke_id', kk.id);
  nem(eXoa);

  const thuc = dong.filter((d) => d.so_luong > 0);
  if (thuc.length) {
    const { error: eThem } = await supabase
      .from('kiem_ke_ct')
      .insert(thuc.map((d) => ({ bep_id: bepId, kiem_ke_id: kk!.id, ...d })));
    nem(eThem);
  }

  const { error: eChot } = await supabase.from('kiem_ke').update({ da_chot: chot }).eq('id', kk.id);
  nem(eChot);
}
