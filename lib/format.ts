import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// ── Tiền ──

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** 2450000 → "2.450.000" */
export function tien(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0';
  return nf.format(Math.round(n));
}

/** 2450000 → "2.450.000 ₫" */
export function tienD(n: number | null | undefined): string {
  return `${tien(n)} ₫`;
}

/**
 * Rút gọn khi > 1 triệu — thẻ số to trên điện thoại không đủ chỗ.
 * 2450000 → "2,4tr" · 68400000 → "68,4tr" · 1200000000 → "1,2 tỷ" · 890000 → "890.000"
 */
export function tienNgan(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0';
  const v = Math.round(n);
  const dau = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a >= 1_000_000_000) return `${dau}${(a / 1_000_000_000).toFixed(1).replace('.', ',').replace(',0', '')} tỷ`;
  if (a >= 1_000_000) return `${dau}${(a / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')}tr`;
  return `${dau}${nf.format(a)}`;
}

/** "12.000" hoặc "12000" hoặc "12k" → 12000. Ngoài chợ hay gõ "120k". */
export function docSoTien(s: string): number {
  if (!s) return 0;
  const raw = s.trim().toLowerCase().replace(/\s/g, '');
  const nhan = raw.endsWith('k') ? 1000 : raw.endsWith('tr') || raw.endsWith('m') ? 1_000_000 : 1;
  const so = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(so);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * nhan);
}

/** Số lượng: giữ tối đa 3 chữ số thập phân, bỏ số 0 thừa. 5.000 → "5" · 0.500 → "0,5" */
export function soLuong(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n);
}

/** Phần trăm: 64.2 → "64,2%" */
export function phanTram(n: number | null | undefined, soLe = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: soLe }).format(n)}%`;
}

// ── Ngày ──

/** Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD (KHÔNG dùng toISOString — lệch múi giờ). */
export function homNay(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function toDate(d: string | Date): Date {
  return typeof d === 'string' ? parseISO(d) : d;
}

/** "2026-08-14" → "14/08" */
export function ngayNgan(d: string | Date): string {
  return format(toDate(d), 'dd/MM', { locale: vi });
}

/** "2026-08-14" → "14/08/2026" */
export function ngayDay(d: string | Date): string {
  return format(toDate(d), 'dd/MM/yyyy', { locale: vi });
}

/** "2026-08-14" → "Thứ Năm, 14/08" */
export function ngayCoThu(d: string | Date): string {
  const s = format(toDate(d), 'EEEE, dd/MM', { locale: vi });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "11:42" */
export function gio(d: string | Date): string {
  return format(toDate(d), 'HH:mm');
}

/** "3 ngày trước" */
export function truoc(d: string | Date | null): string {
  if (!d) return 'chưa đặt';
  return `${formatDistanceToNowStrict(toDate(d), { locale: vi })} trước`;
}

export function congNgay(d: string, n: number): string {
  const dt = parseISO(d);
  dt.setDate(dt.getDate() + n);
  return format(dt, 'yyyy-MM-dd');
}

// ── Tìm kiếm tiếng Việt ──

/** "Thịt ba chỉ" → "thit ba chi". Dùng cho autocomplete gõ không dấu. */
export function boDau(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh + dấu mũ
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Khớp mờ: gõ "tbc" hay "ba chi" đều ra "Thịt ba chỉ". */
export function khop(ten: string, tuKhoa: string): boolean {
  const t = boDau(tuKhoa);
  if (!t) return true;
  const n = boDau(ten);
  if (n.includes(t)) return true;
  // viết tắt theo chữ cái đầu mỗi từ
  const tat = n
    .split(/\s+/)
    .map((w) => w[0])
    .join('');
  return tat.includes(t.replace(/\s/g, ''));
}

/** Chuẩn hoá SĐT để so khớp: bỏ khoảng trắng, dấu chấm, +84 → 0 */
export function chuanSdt(s: string): string {
  const d = (s || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+84')) return '0' + d.slice(3);
  if (d.startsWith('84') && d.length >= 10) return '0' + d.slice(2);
  return d;
}
