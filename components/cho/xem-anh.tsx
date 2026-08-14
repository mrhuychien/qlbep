'use client';

import { useCallback, useEffect, useState } from 'react';
import { Camera, ImageOff, Loader2 } from 'lucide-react';
import { linkAnhCho } from '@/lib/queries';
import { ngayDay } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loi } from '@/components/trang-thai';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Chụp ảnh tờ giấy chợ mà không xem lại được thì bằng không. Bucket là private
 * nên phải xin link ký tạm (1 giờ) mỗi lần mở — không cache link vì nó hết hạn.
 *
 * Chưa có ảnh nào → bấm là mở thẳng máy ảnh.
 * Đã có ảnh    → bấm là mở khung xem, trong đó có nút chụp thêm.
 */
export function XemAnhCho({
  ngay,
  duong,
  dangTaiAnh,
  onChup,
}: {
  ngay: string;
  duong: string[];
  dangTaiAnh: boolean;
  onChup: () => void;
}) {
  const [mo, setMo] = useState(false);
  const [anh, setAnh] = useState<{ duong: string; url: string }[]>([]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    if (!duong.length) return;
    setDangTai(true);
    setLoi(null);
    try {
      setAnh(await linkAnhCho(duong));
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    } finally {
      setDangTai(false);
    }
  }, [duong]);

  useEffect(() => {
    if (mo) void tai();
  }, [mo, tai]);

  const co = duong.length > 0;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={dangTaiAnh}
        onClick={() => (co ? setMo(true) : onChup())}
        className="flex-1"
      >
        {dangTaiAnh ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        Ảnh giấy{co && ` (${duong.length})`}
      </Button>

      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ảnh giấy chợ</DialogTitle>
            <DialogDescription>
              {duong.length} ảnh của ngày {ngayDay(ngay)}. Chạm vào ảnh để mở to.
            </DialogDescription>
          </DialogHeader>

          {loi && <Loi loi={loi} thuLai={tai} />}

          {dangTai ? (
            <div className="grid grid-cols-2 gap-2">
              {duong.map((d) => (
                <Skeleton key={d} className="aspect-[3/4] w-full" />
              ))}
            </div>
          ) : anh.length === 0 && !loi ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
              <p className="text-sm">
                Không mở được ảnh. Kiểm tra bucket <strong>anh-cho</strong> đã có policy đọc chưa
                (chạy <code>sql/storage_anh_cho.sql</code>).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {anh.map((a, i) => (
                <a
                  key={a.duong}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-xl border border-border bg-secondary"
                >
                  {/* Ảnh chụp giấy — dùng <img> thường vì next/image không chạy
                      với output: 'export' + link ký tạm */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={`Ảnh giấy chợ ${i + 1} ngày ${ngayDay(ngay)}`}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMo(false);
              onChup();
            }}
            className="w-full"
          >
            <Camera className="h-5 w-5" />
            Chụp thêm
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
