import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Ném sớm còn hơn để query lỗi 401 khó hiểu lúc chạy
  throw new Error(
    'Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example thành .env.local rồi điền.',
  );
}

/** Singleton — mọi query của app đi qua client này. RLS lo phần bảo mật. */
export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const BUCKET_ANH_CHO = 'anh-cho';
