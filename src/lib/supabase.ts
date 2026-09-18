import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iaodbzehficmwikzgtfs.supabase.co';
const supabaseAnonKey = 'sb_publishable_CcjYhlZGo86Tyb3RDNo7DQ_Reojyco3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
