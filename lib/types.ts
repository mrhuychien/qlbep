// Types khớp 1-1 với sql/schema.sql. Sửa schema thì sửa luôn file này.

export type PhanLoaiNl = 'A' | 'B';
export type NhomNl =
  | 'thit'
  | 'thuy_san'
  | 'rau_cu'
  | 'trai_cay'
  | 'gia_vi'
  | 'do_kho'
  | 'dau_mo'
  | 'khac';
export type NhomMon = 'man' | 'canh' | 'rau' | 'com_bun' | 'trang_mieng' | 'khac';
export type KenhDat = 'zalo' | 'facebook' | 'dien_thoai' | 'truc_tiep' | 'khac';
export type TrangThaiDon = 'moi' | 'dang_giao' | 'hoan_thanh' | 'huy';
export type LoaiChiPhi =
  | 'gas'
  | 'dien_nuoc'
  | 'luong'
  | 'mat_bang'
  | 'xang_xe'
  | 'bao_bi'
  | 'thue_phi'
  | 'khac';
export type VaiTro = 'chu' | 'bep' | 'ban_hang';

export const NHOM_NL_LABEL: Record<NhomNl, string> = {
  thit: 'Thịt',
  thuy_san: 'Thuỷ sản',
  rau_cu: 'Rau củ',
  trai_cay: 'Trái cây',
  gia_vi: 'Gia vị',
  do_kho: 'Đồ khô',
  dau_mo: 'Dầu mỡ',
  khac: 'Khác',
};

export const NHOM_MON_LABEL: Record<NhomMon, string> = {
  man: 'Món mặn',
  canh: 'Canh',
  rau: 'Rau',
  com_bun: 'Cơm / Bún',
  trang_mieng: 'Tráng miệng',
  khac: 'Khác',
};

export const KENH_DAT_LABEL: Record<KenhDat, string> = {
  zalo: 'Zalo',
  facebook: 'Facebook',
  dien_thoai: 'Gọi',
  truc_tiep: 'Trực tiếp',
  khac: 'Khác',
};

export const LOAI_CHI_PHI_LABEL: Record<LoaiChiPhi, string> = {
  gas: 'Gas',
  dien_nuoc: 'Điện nước',
  luong: 'Lương',
  mat_bang: 'Mặt bằng',
  xang_xe: 'Xăng xe',
  bao_bi: 'Bao bì',
  thue_phi: 'Thuế phí',
  khac: 'Khác',
};

export interface Bep {
  id: string;
  ten: string;
  dia_chi: string | null;
  sdt: string | null;
  active: boolean;
  created_at: string;
}

export interface BepUser {
  id: string;
  bep_id: string;
  user_id: string;
  vai_tro: VaiTro;
  created_at: string;
}

export interface NguyenLieu {
  id: string;
  bep_id: string;
  global_id: number | null;
  ten: string;
  nhom: NhomNl;
  dvt_cho: string;
  dvt_chuan: string;
  he_so_quy_doi: number;
  yield_pct: number;
  phan_loai: PhanLoaiNl;
  gia_gan_nhat: number | null;
  ngay_gia: string | null;
  active: boolean;
  created_at: string;
}

export interface MonAn {
  id: string;
  bep_id: string;
  ten: string;
  nhom: NhomMon;
  gia_ban_mac_dinh: number | null;
  lan_cuoi_nau: string | null;
  so_lan_nau: number;
  active: boolean;
  created_at: string;
}

export interface PhieuCho {
  id: string;
  bep_id: string;
  ngay: string;
  nguoi_di_cho: string | null;
  tong_tien: number;
  anh_url: string[] | null;
  ghi_chu: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PhieuChoCt {
  id: string;
  bep_id: string;
  phieu_id: string;
  nguyen_lieu_id: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number; // generated
  mon_an_id: string | null;
  ghi_chu: string | null;
}

export interface ThucDonNgay {
  id: string;
  bep_id: string;
  ngay: string;
  mon_an_id: string;
  ten_mon: string;
  gia_ban: number;
  sl_du_kien: number;
  sl_ban: number;
  sl_du: number | null;
  da_chot: boolean;
  thu_tu: number;
  ghi_chu: string | null;
}

export interface KhachHang {
  id: string;
  bep_id: string;
  sdt: string;
  ten: string;
  dia_chi: string | null;
  ghi_chu: string | null;
  lan_dau_dat: string | null;
  lan_cuoi_dat: string | null;
  tong_don: number;
  tong_tien: number;
  active: boolean;
  created_at: string;
}

export interface DonHang {
  id: string;
  bep_id: string;
  ngay: string;
  ma_don: string | null;
  khach_hang_id: string | null;
  ten_khach: string | null;
  sdt_khach: string | null;
  dia_chi_giao: string | null;
  kenh_dat: KenhDat;
  tong_hang: number;
  phi_ship_thu_khach: number;
  giam_gia: number;
  tong_thanh_toan: number; // generated
  da_thu: boolean;
  trang_thai: TrangThaiDon;
  nguoi_ship: string | null;
  ghi_chu: string | null;
  created_at: string;
}

export interface DonHangCt {
  id: string;
  bep_id: string;
  don_hang_id: string;
  thuc_don_id: string | null;
  ten_mon: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number; // generated
}

export interface ChiPhiKhac {
  id: string;
  bep_id: string;
  ngay: string;
  loai: LoaiChiPhi;
  dien_giai: string | null;
  so_tien: number;
  ghi_chu: string | null;
  created_at: string;
}

export interface KiemKe {
  id: string;
  bep_id: string;
  ngay: string;
  tong_gia_tri: number;
  da_chot: boolean;
  ghi_chu: string | null;
  created_at: string;
}

export interface KiemKeCt {
  id: string;
  bep_id: string;
  kiem_ke_id: string;
  nguyen_lieu_id: string;
  so_luong: number;
  don_gia: number;
  gia_tri: number; // generated
}

// ── View & function ──

export interface GiaVonMonNgay {
  bep_id: string;
  ngay: string;
  mon_an_id: string;
  ten_mon: string | null;
  sl_du_kien: number | null;
  sl_ban: number | null;
  sl_du: number | null;
  gia_ban: number | null;
  cp_truc_tiep: number;
  cp_phan_bo: number | null;
  gia_von_suat: number | null;
  food_cost_pct: number | null;
}

export interface WasteMon {
  bep_id: string;
  ngay: string;
  mon_an_id: string;
  ten_mon: string;
  sl_du_kien: number;
  sl_ban: number;
  sl_du: number;
  ty_le_du_pct: number | null;
  het_som: boolean;
  tien_do_di: number;
}

export interface Pnl {
  doanh_thu: number;
  chi_nhom_b: number;
  mua_nhom_a: number;
  ton_dau_a: number;
  ton_cuoi_a: number;
  gia_von: number;
  chi_phi_khac_: number;
  lai_gop: number;
  lai_rong: number;
  food_cost_pct: number | null;
}
