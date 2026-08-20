'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { KEY_MUA, muaTheoNgay, type Mua } from './mua';

interface MuaValue {
  mua: Mua;
  datMua: (m: Mua) => void;
  /** true = người dùng chưa chọn tay, đang chạy theo tháng */
  tuDong: boolean;
}

const Ctx = createContext<MuaValue | null>(null);

export function MuaProvider({ children }: { children: ReactNode }) {
  // Render lần đầu phải khớp HTML tĩnh (static export) → lấy mùa theo tháng,
  // rồi mới đọc lựa chọn đã lưu ở effect. Không thì hydrate lệch.
  const [mua, setMua] = useState<Mua>(() => muaTheoNgay());
  const [tuDong, setTuDong] = useState(true);

  useEffect(() => {
    const luu = localStorage.getItem(KEY_MUA) as Mua | null;
    if (luu && ['xuan', 'ha', 'thu', 'dong'].includes(luu)) {
      setMua(luu);
      setTuDong(false);
    }
  }, []);

  function datMua(m: Mua) {
    setMua(m);
    setTuDong(false);
    localStorage.setItem(KEY_MUA, m);
  }

  return <Ctx.Provider value={{ mua, datMua, tuDong }}>{children}</Ctx.Provider>;
}

export function useMua() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMua phải nằm trong <MuaProvider>');
  return v;
}
