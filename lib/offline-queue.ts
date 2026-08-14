'use client';

import { get, set } from 'idb-keyval';
import type { DongChoLuu } from './queries';
import { luuPhieuCho } from './queries';

const KEY = 'so_bep_hang_cho';

/**
 * CHỈ xếp hàng thao tác ghi được LẶP LẠI mà kết quả không đổi.
 * Phiếu chợ đủ điều kiện: luuPhieuCho gửi trọn danh sách dòng và GHI ĐÈ, nên gửi
 * lại 3 lần vẫn ra một kết quả.
 * KHÔNG xếp hàng thao tác cần đọc trạng thái hiện tại của server (trừ suất trong
 * thực đơn, kiểm tồn) — những cái đó phải chờ mạng và nói rõ lý do.
 */
export interface CongViec {
  id: string;
  bepId: string;
  ngay: string;
  dong: DongChoLuu[];
  taoLuc: number;
  /** Lỗi nghiệp vụ lần gửi trước — giữ nguyên văn, KHÔNG xoá âm thầm. */
  loi?: string;
}

async function doc(): Promise<CongViec[]> {
  return (await get<CongViec[]>(KEY)) ?? [];
}

async function ghi(ds: CongViec[]): Promise<void> {
  await set(KEY, ds);
  phatTinHieu();
}

// ── Đăng ký để UI cập nhật badge "chờ sync" ──
const nguoiNghe = new Set<() => void>();
export function ngheHangCho(fn: () => void): () => void {
  nguoiNghe.add(fn);
  return () => nguoiNghe.delete(fn);
}
function phatTinHieu() {
  nguoiNghe.forEach((f) => f());
}

/** Một ngày chỉ giữ một công việc: bản sau ghi đè bản trước. */
export async function xepHang(cv: Omit<CongViec, 'id' | 'taoLuc'>): Promise<void> {
  const ds = await doc();
  const khac = ds.filter((c) => !(c.bepId === cv.bepId && c.ngay === cv.ngay));
  khac.push({ ...cv, id: `${cv.bepId}|${cv.ngay}`, taoLuc: Date.now() });
  await ghi(khac);
}

export async function danhSachCho(): Promise<CongViec[]> {
  return doc();
}

export async function soCho(): Promise<number> {
  return (await doc()).length;
}

export async function boCongViec(id: string): Promise<void> {
  await ghi((await doc()).filter((c) => c.id !== id));
}

/** Đẩy hàng đợi lên server. Trả về số việc thành công / còn kẹt. */
export async function day(): Promise<{ xong: number; ket: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { xong: 0, ket: (await doc()).length };
  }

  const ds = await doc();
  const conLai: CongViec[] = [];
  let xong = 0;

  for (const cv of ds) {
    try {
      await luuPhieuCho(cv.bepId, cv.ngay, cv.dong);
      xong++;
    } catch (e) {
      // Giữ lại kèm nguyên văn lỗi — dữ liệu gõ tay giữa chợ không được biến mất
      conLai.push({ ...cv, loi: e instanceof Error ? e.message : String(e) });
    }
  }

  await ghi(conLai);
  return { xong, ket: conLai.length };
}

/** Tự đẩy lại khi có mạng trở lại. Gọi một lần lúc app khởi động. */
export function tuDongDay(khiXong?: (kq: { xong: number; ket: number }) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const chay = () => {
    void day().then((kq) => {
      if (kq.xong > 0) khiXong?.(kq);
    });
  };

  window.addEventListener('online', chay);
  chay();
  return () => window.removeEventListener('online', chay);
}
