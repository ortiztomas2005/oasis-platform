import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjjpmetithnzkmisnbk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqanBtZXRpdGhuemttaXNuYmsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3MjQ1NjA5OSwiZXhwIjoyMDg4MDMyMDk5fQ.N59V83N31eGZZ_X2yH0_R5650Ww7y1lIcx-3lTkh32A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);