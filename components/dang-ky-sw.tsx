'use client';

import { useEffect } from 'react';

/**
 * next-pwa 5.6 chỉ tự chèn đoạn đăng ký vào entry `main.js` của Pages Router;
 * App Router dùng entry `main-app` nên KHÔNG được vá — service worker sinh ra
 * đủ nhưng không ai đăng ký, app im lặng mất khả năng chạy offline.
 * Vì vậy next.config.js để register:false và tự đăng ký ở đây.
 */
export function DangKySW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const dangKy = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((e) => {
        // Không chặn app — chỉ mất phần offline
        console.warn('Không đăng ký được service worker:', e);
      });
    };

    if (document.readyState === 'complete') dangKy();
    else window.addEventListener('load', dangKy, { once: true });
  }, []);

  return null;
}
