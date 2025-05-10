'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Ensure this is the browser client
import { Profile } from '@/lib/supabase';

// Type definitions
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize authentication state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (session?.user?.id) {
          console.log('AuthContext: Session found. User ID:', session.user.id, 'Session object:', JSON.stringify(session, null, 2));
          await fetchProfile(session.user.id);
        } else {
          console.log('AuthContext: No active session or user ID found.', 'Session:', JSON.stringify(session, null, 2));
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Initialize session
    const initSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      }
      
      setIsLoading(false);
    };

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile data
  const fetchProfile = async (userId: string) => {
    console.log('AuthContext: fetchProfile called for userId:', userId);
    if (!userId) {
      console.error('AuthContext: fetchProfile called with null or undefined userId. Aborting.');
      setProfile(null);
      return;
    }

    try {
      console.log('AuthContext: Attempting to fetch profile from Supabase for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Log the full error object structure
        console.error('AuthContext: Supabase error fetching profile. Code:', error.code, 'Message:', error.message, 'Details:', error.details, 'Hint:', error.hint);
        console.error('AuthContext: Full Supabase error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        if (error.code === 'PGRST116') { // 'PGRST116' is 'Searched for a single row, but 0 rows were found'
          console.warn('AuthContext: Profile not found for userId (PGRST116):', userId, '. Attempting to create one.');
          // Proceed to create profile logic
        } else {
          throw error; // Re-throw other errors
        }
      }

      if (data) {
        console.log('AuthContext: Profile successfully fetched:', JSON.stringify(data, null, 2));
        setProfile(data as Profile);
        return; // Profile found and set, exit
      }

      // If error was PGRST116 or data is null, try to create profile
      console.log('AuthContext: Profile not found or PGRST116, attempting to create new profile for user:', userId);
      const { data: authUserData, error: authUserError } = await supabase.auth.getUser();

      if (authUserError) {
        console.error('AuthContext: Error getting user data from supabase.auth.getUser():', JSON.stringify(authUserError, Object.getOwnPropertyNames(authUserError)));
        throw authUserError;
      }

      if (!authUserData?.user) {
        console.error('AuthContext: supabase.auth.getUser() did not return user data. Cannot create profile.');
        setProfile(null);
        return;
      }
      
      const username = generateUsername();
      const fullName = authUserData.user.user_metadata?.full_name || 'New User';
      const email = authUserData.user.email || '';
      const avatarUrl = authUserData.user.user_metadata?.avatar_url || '';

      console.log(`AuthContext: Creating profile with: userId=${userId}, username=${username}, fullName=${fullName}, email=${email}, avatarUrl=${avatarUrl ? 'present' : 'not present'}`);

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            username,
            full_name: fullName,
            email,
            avatar_url: avatarUrl,
          },
        ])
        .select('*')
        .single();

      if (createError) {
        console.error('AuthContext: Supabase error creating profile. Code:', createError.code, 'Message:', createError.message, 'Details:', createError.details, 'Hint:', createError.hint);
        console.error('AuthContext: Full Supabase error object during profile creation:', JSON.stringify(createError, Object.getOwnPropertyNames(createError)));
        throw createError;
      }

      console.log('AuthContext: New profile created successfully:', JSON.stringify(newProfile, null, 2));
      setProfile(newProfile as Profile);

    } catch (error: any) {
      // Catch all for any other errors in the try block
      console.error('AuthContext: Overall catch block in fetchProfile. Error message:', error.message);
      console.error('AuthContext: Full error object in fetchProfile catch:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      setProfile(null);
    }
  };

  // Function to generate a Reddit-style username
  const generateUsername = () => {
    const adjectives = ['Happy', 'Clever', 'Brave', 'Mighty', 'Quick', 'Silent', 'Wise', 'Noble', 'Proud', 'Bold'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Shark', 'Wolf', 'Fox', 'Bear', 'Hawk', 'Lion', 'Whale'];
    const randomNum = Math.floor(Math.random() * 10000);
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${randomNum}`;
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
