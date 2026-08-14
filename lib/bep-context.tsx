'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';
import type { Bep } from './types';

const KEY = 'so_bep_id';

interface BepValue {
  bep: Bep | null;
  bepId: string | null;
  danhSach: Bep[];
  dangTai: boolean;
  taoBep: (ten: string, diaChi?: string, sdt?: string) => Promise<{ error: string | null }>;
  chonBep: (id: string) => void;
  taiLai: () => Promise<void>;
}

const Ctx = createContext<BepValue | null>(null);

export function BepProvider({ children }: { children: ReactNode }) {
  const { user, dangTai: dangTaiAuth } = useAuth();
  const [danhSach, setDanhSach] = useState<Bep[]>([]);
  const [bepId, setBepId] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);

  const tai = useCallback(async () => {
    if (!user) {
      setDanhSach([]);
      setBepId(null);
      setDangTai(false);
      return;
    }
    setDangTai(true);
    // RLS đã lọc sẵn: chỉ trả về bếp user thuộc về
    const { data } = await supabase.from('bep').select('*').eq('active', true).order('created_at');
    const ds = (data ?? []) as Bep[];
    setDanhSach(ds);

    const luu = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
    const chon = ds.find((b) => b.id === luu)?.id ?? ds[0]?.id ?? null;
    setBepId(chon);
    if (chon && typeof window !== 'undefined') localStorage.setItem(KEY, chon);
    setDangTai(false);
  }, [user]);

  useEffect(() => {
    if (dangTaiAuth) return;
    void tai();
  }, [dangTaiAuth, tai]);

  async function taoBep(ten: string, diaChi?: string, sdt?: string) {
    const { error } = await supabase.rpc('fn_tao_bep', {
      ten,
      dia_chi: diaChi ?? null,
      sdt: sdt ?? null,
    });
    if (error) return { error: error.message };
    await tai();
    return { error: null };
  }

  function chonBep(id: string) {
    setBepId(id);
    if (typeof window !== 'undefined') localStorage.setItem(KEY, id);
  }

  const bep = danhSach.find((b) => b.id === bepId) ?? null;

  return (
    <Ctx.Provider value={{ bep, bepId, danhSach, dangTai, taoBep, chonBep, taiLai: tai }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBep() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBep phải nằm trong <BepProvider>');
  return v;
}

/** Dùng trong màn nghiệp vụ — chắc chắn đã qua <Guard> nên bepId không null. */
export function useBepId(): string {
  const { bepId } = useBep();
  return bepId as string;
}
