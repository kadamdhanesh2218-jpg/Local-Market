import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Check your .env.local file."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local file."
  );
}

if (supabaseAnonKey.startsWith("sb_secret_")) {
  throw new Error(
    "A Supabase secret key is being used in the browser. Replace it with the Supabase publishable key."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);