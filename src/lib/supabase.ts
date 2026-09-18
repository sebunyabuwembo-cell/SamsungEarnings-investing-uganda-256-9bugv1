import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || 'https://cigzpcpyexbquwfccigz.backend.onspace.ai';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
