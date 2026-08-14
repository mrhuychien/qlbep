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
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
      >
        <UserRound className="h-5 w-5" />
      </button>

      <Sheet open={mo} onOpenChange={setMo}>
        <SheetContent side="bottom" className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>{bep?.ten ?? 'Bếp của bạn'}</SheetTitle>
            <SheetDescription>{user?.email}</SheetDescription>
          </SheetHeader>

          {bep && (bep.dia_chi || bep.sdt) && (
            <p className="text-sm text-muted-foreground">
              {[bep.dia_chi, bep.sdt].filter(Boolean).join(' · ')}
            </p>
          )}

          <Button variant="outline" onClick={dangXuat} className="w-full">
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
