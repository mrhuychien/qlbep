export type Mua = 'xuan' | 'ha' | 'thu' | 'dong';

export const MUA: { ma: Mua; ten: string; icon: string }[] = [
  { ma: 'xuan', ten: 'Xuân', icon: '🌸' },
  { ma: 'ha', ten: 'Hạ', icon: '☀️' },
  { ma: 'thu', ten: 'Thu', icon: '🍂' },
  { ma: 'dong', ten: 'Đông', icon: '❄️' },
];

export const KEY_MUA = 'so_bep_mua';

/**
 * Lịch mùa của người Việt (không phải lịch thiên văn phương Tây):
 * 4/2 → 4/5 Xuân · 5/5 → 6/8 Hạ · 7/8 → 6/11 Thu · còn lại Đông.
 */
export function muaTheoNgay(d = new Date()): Mua {
  const moc = (d.getMonth() + 1) * 100 + d.getDate(); // MMDD
  if (moc >= 204 && moc <= 504) return 'xuan';
  if (moc >= 505 && moc <= 806) return 'ha';
  if (moc >= 807 && moc <= 1106) return 'thu';
  return 'dong';
}

export function nhanMua(m: Mua) {
  return MUA.find((x) => x.ma === m) ?? MUA[0];
}
