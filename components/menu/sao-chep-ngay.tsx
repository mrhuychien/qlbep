'use client';

import { useEffect, useState } from 'react';
import { CopyPlus, Loader2 } from 'lucide-react';
import { ngayCoThucDon, saoChepThucDon } from '@/lib/queries';
import { ngayCoThu } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

/** Bếp hay nấu lặp lại — copy nguyên thực đơn một ngày cũ nhanh hơn gõ lại 3 món. */
export function SaoChepNgay({
  bepId,
  ngay,
  onXong,
}: {
  bepId: string;
  ngay: string;
  onXong: () => void;
}) {
  const [mo, setMo] = useState(false);
  const [ds, setDs] = useState<string[]>([]);
  const [dangTai, setDangTai] = useState(false);
  const [dangChep, setDangChep] = useState<string | null>(null);

  useEffect(() => {
    if (!mo) return;
    setDangTai(true);
    ngayCoThucDon(bepId, ngay, 14)
      .then(setDs)
      .catch(() => setDs([]))
      .finally(() => setDangTai(false));
  }, [mo, bepId, ngay]);

  async function chep(tu: string) {
    setDangChep(tu);
    try {
      const so = await saoChepThucDon(bepId, tu, ngay);
      if (so === 0) toastOk('Không có gì để chép', 'Các món của ngày đó đã có sẵn trong thực đơn này.');
      else toastOk(`Đã chép ${so} món`);
      setMo(false);
      onXong();
    } catch (e) {
      toastLoi('Chưa chép được', e instanceof Error ? e.message : String(e));
    } finally {
      setDangChep(null);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setMo(true)} className="flex-1">
        <CopyPlus className="h-5 w-5" />
        Chép ngày cũ
      </Button>

      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sao chép thực đơn</DialogTitle>
            <DialogDescription>Chọn ngày muốn chép sang {ngayCoThu(ngay)}.</DialogDescription>
          </DialogHeader>

          {dangTai ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tìm ngày có thực đơn…
            </p>
          ) : ds.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có ngày nào trước đó để chép.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {ds.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => chep(d)}
                  disabled={dangChep !== null}
                  className="flex min-h-tap items-center justify-between rounded-lg border border-border px-3 text-left font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  {ngayCoThu(d)}
                  {dangChep === d && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
