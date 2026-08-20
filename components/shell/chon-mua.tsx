'use client';

import { useState } from 'react';
import { useMua } from '@/lib/mua-context';
import { MUA, nhanMua } from '@/lib/mua';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Chữ ký nhận diện của hệ NPP: cả app đổi tông theo mùa trong 0.6s.
 * Lần đầu tự chọn theo tháng (lịch VN), sau đó nhớ lựa chọn tay.
 */
export function ChonMua() {
  const { mua, datMua, tuDong } = useMua();
  const [mo, setMo] = useState(false);
  const hienTai = nhanMua(mua);

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        aria-label={`Đổi mùa — đang là ${hienTai.ten}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-lg transition-colors hover:bg-surface-2 active:scale-95"
      >
        <span aria-hidden>{hienTai.icon}</span>
      </button>

      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Đổi mùa</DialogTitle>
            <DialogDescription>
              {tuDong
                ? `Đang tự chọn theo tháng — hiện là ${hienTai.ten}.`
                : `Bạn đang chọn tay: ${hienTai.ten}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {MUA.map((m) => (
              <button
                key={m.ma}
                type="button"
                onClick={() => {
                  datMua(m.ma);
                  setMo(false);
                }}
                aria-pressed={m.ma === mua}
                className={cn(
                  'flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-lg border text-sm font-bold transition-all active:scale-[0.97]',
                  m.ma === mua
                    ? 'border-transparent nen-mua text-white shadow-md'
                    : 'border-border bg-card text-text-2 hover:bg-surface-2',
                )}
              >
                <span className="text-2xl" aria-hidden>
                  {m.icon}
                </span>
                {m.ten}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
