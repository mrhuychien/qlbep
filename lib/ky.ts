import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

export type MaKy = 'thang_nay' | 'thang_truoc' | 'tuan_nay' | 'tuy_chon';

export interface Ky {
  tu: string;
  den: string;
}

const f = (d: Date) => format(d, 'yyyy-MM-dd');

export const KY_NHAN: Record<MaKy, string> = {
  thang_nay: 'Tháng này',
  thang_truoc: 'Tháng trước',
  tuan_nay: 'Tuần này',
  tuy_chon: 'Tuỳ chọn',
};

export function tinhKy(ma: MaKy, hienTai?: Ky): Ky {
  const nay = new Date();
  switch (ma) {
    case 'thang_nay':
      return { tu: f(startOfMonth(nay)), den: f(endOfMonth(nay)) };
    case 'thang_truoc': {
      const t = subMonths(nay, 1);
      return { tu: f(startOfMonth(t)), den: f(endOfMonth(t)) };
    }
    case 'tuan_nay':
      // Tuần bắt đầu thứ Hai — cách đếm tuần của người Việt
      return { tu: f(startOfWeek(nay, { weekStartsOn: 1 })), den: f(endOfWeek(nay, { weekStartsOn: 1 })) };
    default:
      return hienTai ?? { tu: f(startOfMonth(nay)), den: f(endOfMonth(nay)) };
  }
}

/** Kỳ liền trước cùng độ dài — dùng cho "Lặp lại tháng trước". */
export function thangTruocCua(ky: Ky): Ky {
  const t = subMonths(new Date(ky.tu), 1);
  return { tu: f(startOfMonth(t)), den: f(endOfMonth(t)) };
}
