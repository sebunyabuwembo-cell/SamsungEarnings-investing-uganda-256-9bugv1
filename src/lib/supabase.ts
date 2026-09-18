import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://cigzpcpyexbquwfccigz.backend.onspace.ai';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV8rw6HtnRmRYpvlV0iLPAGWHiTYOJ4qQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
