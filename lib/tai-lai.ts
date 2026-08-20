'use client';

import { useEffect } from 'react';

const SU_KIEN = 'so-bep:tai-lai';

/** Nút ↻ trên header phát tín hiệu; màn nào đang mở thì tự tải lại của màn đó. */
export function phatTaiLai() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SU_KIEN));
}

export function useTaiLaiKhiBam(fn: () => void) {
  useEffect(() => {
    const h = () => fn();
    window.addEventListener(SU_KIEN, h);
    return () => window.removeEventListener(SU_KIEN, h);
  }, [fn]);
}
