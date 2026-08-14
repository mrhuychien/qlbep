'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChefHat, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useBep } from '@/lib/bep-context';
import { NavBottom } from '@/components/nav-bottom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastLoi } from '@/components/ui/use-toast';

function ManCho({ chu }: { chu: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin" />
      <p className="text-sm font-medium">{chu}</p>
    </div>
  );
}

/** Chưa có bếp nào → bắt buộc tạo trước khi vào app. Gọi fn_tao_bep (kèm copy nguyên liệu mẫu). */
function FormTaoBep() {
  const { taoBep } = useBep();
  const [ten, setTen] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [sdt, setSdt] = useState('');
  const [dangGui, setDangGui] = useState(false);

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (!ten.trim()) return;
    setDangGui(true);
    const { error } = await taoBep(ten.trim(), diaChi.trim() || undefined, sdt.trim() || undefined);
    setDangGui(false);
    if (error) {
      toastLoi('Chưa tạo được bếp', error);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 p-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ChefHat className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">Tạo bếp của bạn</h1>
        <p className="text-sm text-muted-foreground">
          Tạo xong sẽ có sẵn danh mục nguyên liệu mẫu để đi chợ ngay.
        </p>
      </div>

      <form onSubmit={gui} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ten">Tên bếp *</Label>
          <Input
            id="ten"
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            placeholder="Bếp Cô Ba"
            required
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dia-chi">Địa chỉ</Label>
          <Input
            id="dia-chi"
            value={diaChi}
            onChange={(e) => setDiaChi(e.target.value)}
            placeholder="Ngõ 5 Lê Lợi"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sdt">Số điện thoại nhận đơn</Label>
          <Input
            id="sdt"
            type="tel"
            inputMode="tel"
            value={sdt}
            onChange={(e) => setSdt(e.target.value)}
            placeholder="0912345678"
          />
        </div>
        <Button type="submit" disabled={dangGui || !ten.trim()} className="mt-1 w-full">
          {dangGui && <Loader2 className="h-4 w-4 animate-spin" />}
          {dangGui ? 'Đang tạo…' : 'Tạo bếp'}
        </Button>
      </form>
    </main>
  );
}

export function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { session, dangTai: dangTaiAuth } = useAuth();
  const { danhSach, dangTai: dangTaiBep } = useBep();

  const laLogin = path === '/login' || path === '/login/';

  useEffect(() => {
    if (dangTaiAuth) return;
    if (!session && !laLogin) router.replace('/login');
    if (session && laLogin) router.replace('/');
  }, [session, dangTaiAuth, laLogin, router]);

  if (laLogin) return <>{children}</>;
  if (dangTaiAuth) return <ManCho chu="Đang mở sổ…" />;
  if (!session) return <ManCho chu="Đang chuyển tới đăng nhập…" />;
  if (dangTaiBep) return <ManCho chu="Đang tải bếp…" />;
  if (danhSach.length === 0) return <FormTaoBep />;

  return (
    <>
      {/* pb-40: chừa chỗ cho bottom-nav (64px) + FAB nổi bên trên */}
      <main className="mx-auto w-full max-w-2xl px-3 pb-40 pt-3">{children}</main>
      <NavBottom />
    </>
  );
}
