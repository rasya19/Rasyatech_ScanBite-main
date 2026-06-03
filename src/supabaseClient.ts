import { createClient } from '@supabase/supabase-js';

// Mengambil variabel env dengan aman menggunakan standar Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validasi & pengecekan jika environment variable belum diisi
const isConfigValid = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigValid) {
  console.warn(
    '⚠️ [Supabase] Menggunakan dummy client - Harap lengkapi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env'
  );
}

// Inisialisasi client. Jika env kosong, gunakan URL tiruan agar aplikasi tidak crash saat import.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);