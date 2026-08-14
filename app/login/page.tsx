'use client';

import { useState } from 'react';
import { ChefHat, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { guiMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [daGui, setDaGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    setDangGui(true);
    const { error } = await guiMagicLink(email);
    setDangGui(false);
    if (error) setLoi(error);
    else setDaGui(true);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ChefHat className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Sổ Bếp</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đi chợ · Thực đơn · Đơn hàng · Lãi lỗ
          </p>
        </div>
      </div>

      {daGui ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-5 text-center">
          <MailCheck className="h-8 w-8 text-success" />
          <div>
            <p className="font-bold text-success-ink">Đã gửi link đăng nhập</p>
            <p className="mt-1 text-sm text-success-ink/80">
              Mở hộp thư <span className="font-semibold">{email}</span> và bấm vào link. Link mở trên
              chính điện thoại này thì vào app luôn.
            </p>
          </div>
          <Button variant="outline" onClick={() => setDaGui(false)} className="w-full">
            Gửi lại / đổi email
          </Button>
        </div>
      ) : (
        <form onSubmit={gui} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@gmail.com"
              required
              autoFocus
            />
          </div>

          {loi && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger-ink">
              {loi}
            </p>
          )}

          <Button type="submit" disabled={dangGui || !email.trim()} className="w-full">
            {dangGui && <Loader2 className="h-4 w-4 animate-spin" />}
            {dangGui ? 'Đang gửi…' : 'Gửi link đăng nhập'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Không cần mật khẩu. Bấm gửi rồi mở email là xong.
          </p>
        </form>
      )}
    </main>
  );
}
