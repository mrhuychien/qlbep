'use client';

import { useEffect } from 'react';

const SU_KIEN = 'so-bep:them';

/**
 * Nút + trên thanh nav phát tín hiệu; màn đang mở tự làm việc "thêm" của mình
 * (mở ô nhập, mở form…). Cách này tránh phải luồn callback từ nav xuống từng
 * màn qua context — nav không cần biết màn nào làm gì.
 */
export function phatThem() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SU_KIEN));
}

export function useThemKhiBam(fn: () => void) {
  useEffect(() => {
    const h = () => fn();
    window.addEventListener(SU_KIEN, h);
    return () => window.removeEventListener(SU_KIEN, h);
  }, [fn]);
}
