'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import type { ThucDonNgay } from '@/lib/types';
import { textChiaSe } from '@/lib/goi-y';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

/** Sinh sẵn text để dán lên Zalo/Facebook — chủ bếp đăng bài mỗi sáng. */
export function ChiaSeMenu({
  ngay,
  ds,
  sdt,
}: {
  ngay: string;
  ds: ThucDonNgay[];
  sdt?: string | null;
}) {
  const [mo, setMo] = useState(false);
  const [daChep, setDaChep] = useState(false);
  const text = textChiaSe(ngay, ds, sdt);

  async function chep() {
    try {
      await navigator.clipboard.writeText(text);
      setDaChep(true);
      toastOk('Đã chép', 'Dán thẳng vào Zalo/Facebook được rồi.');
      setTimeout(() => setDaChep(false), 2500);
    } catch {
      // Clipboard bị chặn (http, quyền) → không im lặng, chỉ vào ô text để chép tay
      toastLoi('Trình duyệt không cho chép tự động', 'Bấm giữ vào khung chữ rồi chọn Copy.');
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setMo(true)} disabled={!ds.length} className="flex-1">
        <Share2 className="h-5 w-5" />
        Chia sẻ
      </Button>

      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng thực đơn</DialogTitle>
            <DialogDescription>Chép rồi dán vào Zalo / Facebook.</DialogDescription>
          </DialogHeader>

          <textarea
            readOnly
            value={text}
            rows={Math.min(ds.length + 3, 12)}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-xl border border-input bg-surface-2 p-3 text-base leading-relaxed"
            aria-label="Nội dung thực đơn để chia sẻ"
          />

          <Button onClick={chep} className="w-full">
            {daChep ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {daChep ? 'Đã chép' : 'Chép nội dung'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
