import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types';

// In a real build environment, these would be in a .env file.
// For this simplified setup, we read them from the window object where index.html injected them.
const supabaseUrl = (window as any).process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (window as any).process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing. Make sure they are set in the script tag in index.html.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);