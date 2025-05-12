import { createServerClient, type CookieOptions as SupabaseCookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import type { User } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const cookieStore = await cookies()

  if (code) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: SupabaseCookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: SupabaseCookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        },
        auth: {
          persistSession: false, 
          autoRefreshToken: false,
          detectSessionInUrl: true 
        }
      }
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/?error=auth-exchange', requestUrl.origin))
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (!profile) {
          const username = generateUsername()
          await supabase.from('profiles').insert({
            user_id: user.id,
            username,
            full_name: user.user_metadata.full_name || '',
            avatar_url: user.user_metadata.avatar_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      }

      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(new URL('/?error=auth-unhandled', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}

function generateUsername(): string {
  const adjectives = ['happy', 'clever', 'brave', 'calm', 'eager', 'kind', 'quick', 'wise']
  const nouns = ['tiger', 'falcon', 'dolphin', 'panda', 'wolf', 'eagle', 'fox', 'lion']
  const randomNum = Math.floor(Math.random() * 10000)
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adjective}-${noun}-${randomNum}`
}

interface CookieOptions {
  domain?: string
  path?: string
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
}

async function createOrUpdateProfile(supabase: any, user: User | null | undefined) {
  if (!user) return;
  
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!existingProfile) {
      const adjectives = ['happy', 'clever', 'brave', 'calm', 'eager', 'kind', 'quick', 'wise'];
      const nouns = ['tiger', 'falcon', 'dolphin', 'panda', 'wolf', 'eagle', 'fox', 'lion'];
      const randomNum = Math.floor(Math.random() * 10000);
      
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const username = `${adjective}-${noun}-${randomNum}`;
      
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
