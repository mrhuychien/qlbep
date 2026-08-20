'use client';

import { useState } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useBep } from '@/lib/bep-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

/** Lối thoát duy nhất khỏi phiên đăng nhập — máy dùng chung thì phải có. */
export function TaiKhoan() {
  const { user, dangXuat } = useAuth();
  const { bep } = useBep();
  const [mo, setMo] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        aria-label="Tài khoản"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-text-2 transition-colors hover:bg-surface-2 active:scale-95"
      >
        <UserRound className="h-[18px] w-[18px]" />
      </button>

      <Sheet open={mo} onOpenChange={setMo}>
        <SheetContent side="bottom" className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>{bep?.ten ?? 'Bếp của bạn'}</SheetTitle>
            <SheetDescription>{user?.email}</SheetDescription>
          </SheetHeader>

          {bep && (bep.dia_chi || bep.sdt) && (
            <p className="text-sm text-text-2">{[bep.dia_chi, bep.sdt].filter(Boolean).join(' · ')}</p>
          )}

          <Button variant="outline" onClick={dangXuat} className="w-full text-danger">
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
