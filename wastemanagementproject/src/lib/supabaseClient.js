import { createClient } from '@supabase/supabase-js';

// Debug: Log environment variables
console.log("🛠 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("🛠 Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Loaded ✅" : "Missing ❌");

// Assign environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Throw an error if variables are missing
if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Supabase URL and Key are required but missing. Check your .env.local file.');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

window.supabase = supabase;


// Export Supabase instance
export default supabase;
