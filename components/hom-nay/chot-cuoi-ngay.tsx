'use client';

import { useState } from 'react';
import { Loader2, MoonStar } from 'lucide-react';
import type { ThucDonNgay } from '@/lib/types';
import { chotCuoiNgay } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toastLoi, toastOk } from '@/components/ui/use-toast';

/**
 * Chốt tối: nhập số suất nấu ra mà KHÔNG bán được. Đây là nguồn lỗ lớn nhất
 * của mô hình này nên phải hỏi thẳng, không suy ra tự động.
 * Mặc định điền sẵn (dự kiến − đã bán) vì đó là trường hợp hay gặp nhất;
 * bán hết thì bấm nút 0.
 */
export function ChotCuoiNgay({ ds, onXong }: { ds: ThucDonNgay[]; onXong: () => void }) {
  const [mo, setMo] = useState(false);
  const [du, setDu] = useState<Record<string, string>>({});
  const [dangLuu, setDangLuu] = useState(false);

  function batDau() {
    const goiY: Record<string, string> = {};
    for (const t of ds) {
      goiY[t.id] = String(Math.max(0, Number(t.sl_du_kien) - Number(t.sl_ban)));
    }
    setDu(goiY);
    setMo(true);
  }

  async function luu() {
    setDangLuu(true);
    try {
      await chotCuoiNgay(
        ds.map((t) => ({ id: t.id, sl_du: Math.max(0, Number(du[t.id] ?? 0) || 0) })),
      );
      toastOk('Đã chốt cuối ngày', 'Số suất dư đã vào báo cáo waste ở Sổ sách.');
      setMo(false);
      onXong();
    } catch (e) {
      toastLoi('Chưa chốt được', e instanceof Error ? e.message : String(e));
    } finally {
      setDangLuu(false);
    }
  }

  const tongDu = ds.reduce((s, t) => s + (Number(du[t.id] ?? 0) || 0), 0);

  return (
    <>
      <Button variant="outline" onClick={batDau} className="w-full">
        <MoonStar className="h-5 w-5" />
        Chốt cuối ngày
      </Button>

      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chốt cuối ngày</DialogTitle>
            <DialogDescription>
              Mỗi món còn dư mấy suất? Bán hết thì bấm <strong>0</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col divide-y divide-border">
            {ds.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.ten_mon}</p>
                  <p className="tabular text-xs text-muted-foreground">
                    nấu {t.sl_du_kien} · bán {t.sl_ban}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={Number(du[t.id]) === 0 ? 'success' : 'outline'}
                  size="iconSm"
                  onClick={() => setDu((p) => ({ ...p, [t.id]: '0' }))}
                  aria-label={`${t.ten_mon}: bán hết`}
                >
                  0
                </Button>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="1"
                  value={du[t.id] ?? ''}
                  onChange={(e) => setDu((p) => ({ ...p, [t.id]: e.target.value }))}
                  onFocus={(e) => e.target.select()}
                  className="tabular w-20 shrink-0 text-center"
                  aria-label={`${t.ten_mon}: số suất dư`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-baseline justify-between rounded-xl bg-secondary px-3 py-2">
            <span className="text-sm font-semibold text-muted-foreground">Tổng dư</span>
            <span className="tabular font-bold">{tongDu} suất</span>
          </div>

          <Button onClick={luu} disabled={dangLuu} className="w-full">
            {dangLuu && <Loader2 className="h-4 w-4 animate-spin" />}
            {dangLuu ? 'Đang lưu…' : 'Lưu & chốt'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
