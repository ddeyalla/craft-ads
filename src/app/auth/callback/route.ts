import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Handle OAuth callback and exchange code for session
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // If no code is provided, redirect to home
  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Create a server-side Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  // Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    console.error('Error exchanging code for session:', error);
    return NextResponse.redirect(new URL('/?error=auth', request.url));
  }
  
  // Check if user has a profile, if not create one with random username
  await createOrUpdateProfile(supabase, data.user);
  
  // Redirect to dashboard upon successful authentication
  return NextResponse.redirect(new URL('/dashboard', request.url));
}

// Helper function to create or update user profile with Reddit-style username if needed
async function createOrUpdateProfile(supabase: any, user: any) {
  if (!user) return;
  
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!existingProfile) {
      // Generate Reddit-style username: adjective-noun-number
      const adjectives = ['happy', 'clever', 'brave', 'calm', 'eager', 'kind', 'quick', 'wise'];
      const nouns = ['tiger', 'falcon', 'dolphin', 'panda', 'wolf', 'eagle', 'fox', 'lion'];
      const randomNum = Math.floor(Math.random() * 10000);
      
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const username = `${adjective}-${noun}-${randomNum}`;
      
      // Create profile
      await supabase.from('profiles').insert({
        user_id: user.id,
        username,
        full_name: user.user_metadata.full_name || '',
        avatar_url: user.user_metadata.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error creating/updating profile:', error);
  }
}
