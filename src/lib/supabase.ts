import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

// Note: These should be in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase credentials. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
  );
}

// Create a Supabase client for the browser that uses cookies
// This format is compatible with the createServerClient in your API routes
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    // Let createBrowserClient use its default cookie handling which is generally
    // more robust for temporary PKCE cookies. We only provide general options.
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      path: '/',       // Ensure cookies are available site-wide
      sameSite: 'Lax', // Common default for modern browsers
    }
  }
);

export type Profile = {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseUser = NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>;
