
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValid = supabaseUrl && supabaseAnonKey && 
                supabaseUrl !== 'YOUR_SUPABASE_URL' && 
                supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const supabase: SupabaseClient | null = isValid 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : (() => {
      console.warn('Supabase environment variables missing or invalid. Supabase functionality is disabled.');
      return null;
    })();
