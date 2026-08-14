import type { ThucDonNgay } from './types';

export interface GoiYSuat {
  /** Số suất đề xuất điền sẵn */
  suat: number;
  /** Câu giải thích ngắn — chỉ hiện khi có tín hiệu rõ, không bịa lý do */
  loiNhan?: string;
  huong?: 'tang' | 'giam';
}

const NGUONG_DU = 20; // % dư coi là nấu thừa
const SO_LAN_XET = 3;

/**
 * Gợi ý số suất dựa lịch sử. Chỉ nói khi 3 lần gần nhất CÙNG một hướng —
 * hai lần dư một lần hết thì im, vì đó là nhiễu chứ không phải xu hướng.
 */
export function goiYSoSuat(lichSu: ThucDonNgay[], giaTriMacDinh = 20): GoiYSuat {
  const daNau = lichSu.filter((t) => Number(t.sl_du_kien) > 0);
  if (!daNau.length) return { suat: giaTriMacDinh };

  const tb = Math.round(daNau.reduce((s, t) => s + Number(t.sl_du_kien), 0) / daNau.length);

  const daChot = daNau.filter((t) => t.da_chot).slice(0, SO_LAN_XET);
  if (daChot.length < SO_LAN_XET) return { suat: tb };

  const tyLeDu = daChot.map((t) => (Number(t.sl_du ?? 0) / Number(t.sl_du_kien)) * 100);
  const hetSom = daChot.map((t) => Number(t.sl_ban) >= Number(t.sl_du_kien));

  if (tyLeDu.every((p) => p > NGUONG_DU)) {
    const duTb = daChot.reduce((s, t) => s + Number(t.sl_du ?? 0), 0) / daChot.length;
    const de = Math.max(1, Math.round(tb - duTb));
    return {
      suat: de,
      huong: 'giam',
      loiNhan: `3 lần gần nhất đều dư trên ${NGUONG_DU}% — thử nấu ${de} suất`,
    };
  }

  if (hetSom.every(Boolean)) {
    const de = Math.round(tb * 1.15);
    return {
      suat: de,
      huong: 'tang',
      loiNhan: `3 lần gần nhất đều hết sớm — thử nấu ${de} suất`,
    };
  }

  return { suat: tb };
}

/** Text dán thẳng lên Zalo/Facebook. */
export function textChiaSe(
  ngay: string,
  mon: { ten_mon: string; gia_ban: number }[],
  sdt?: string | null,
): string {
  const [y, m, d] = ngay.split('-');
  const dong = mon.map((x) => `• ${x.ten_mon} — ${Math.round(x.gia_ban / 1000)}k`);
  return [
    `🍚 THỰC ĐƠN ${d}/${m}${y ? '' : ''}`,
    ...dong,
    sdt ? `📞 Đặt: ${sdt}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
