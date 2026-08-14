'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthValue {
  session: Session | null;
  user: User | null;
  dangTai: boolean;
  guiMagicLink: (email: string) => Promise<{ error: string | null }>;
  dangXuat: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    let huy = false;

    supabase.auth.getSession().then(({ data }) => {
      if (huy) return;
      setSession(data.session);
      setDangTai(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setDangTai(false);
    });

    return () => {
      huy = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function guiMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    return { error: error?.message ?? null };
  }

  async function dangXuat() {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') localStorage.removeItem('so_bep_id');
  }

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, dangTai, guiMagicLink, dangXuat }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return v;
}
