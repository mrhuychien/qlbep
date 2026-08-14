'use client';

import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import { day, danhSachCho, ngheHangCho, type CongViec } from '@/lib/offline-queue';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

/**
 * Mất sóng KHÔNG chặn thao tác. Badge chỉ nói cho người dùng biết dữ liệu đang
 * nằm ở máy, chưa lên server — và cho bấm gửi lại khi có sóng.
 */
export function BadgeOffline() {
  const [cho, setCho] = useState<CongViec[]>([]);
  const [online, setOnline] = useState(true);
  const [dangDay, setDangDay] = useState(false);

  useEffect(() => {
    const capNhat = () => void danhSachCho().then(setCho);
    const doiMang = () => setOnline(navigator.onLine);

    capNhat();
    doiMang();
    const boNghe = ngheHangCho(capNhat);
    window.addEventListener('online', doiMang);
    window.addEventListener('offline', doiMang);
    return () => {
      boNghe();
      window.removeEventListener('online', doiMang);
      window.removeEventListener('offline', doiMang);
    };
  }, []);

  if (online && cho.length === 0) return null;

  const coLoi = cho.find((c) => c.loi);

  async function guiLai() {
    setDangDay(true);
    const kq = await day();
    setDangDay(false);
    if (kq.xong > 0) toastOk(`Đã gửi ${kq.xong} phiếu chợ lên server`);
    if (kq.ket > 0) toastLoi(`Còn ${kq.ket} phiếu chưa gửi được`, 'Bấm gửi lại khi có sóng ổn định.');
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2 text-sm">
      {online ? (
        <CloudOff className="h-4 w-4 shrink-0 text-warning-ink" />
      ) : (
        <WifiOff className="h-4 w-4 shrink-0 text-warning-ink" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-warning-ink">
          {cho.length > 0 ? `${cho.length} phiếu chờ gửi` : 'Đang mất sóng'}
        </p>
        <p className="truncate text-xs text-warning-ink/80">
          {coLoi?.loi
            ? `Lỗi lần trước: ${coLoi.loi}`
            : 'Dữ liệu đã lưu trong máy. Có sóng sẽ tự gửi.'}
        </p>
      </div>
      {cho.length > 0 && online && (
        <button
          type="button"
          onClick={guiLai}
          disabled={dangDay}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-warning/40 px-2.5 text-xs font-bold text-warning-ink disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${dangDay ? 'animate-spin' : ''}`} />
          Gửi lại
        </button>
      )}
    </div>
  );
}
