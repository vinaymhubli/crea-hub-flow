import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
  specialization?: string;
  rate_per_minute?: number;
  user_type: string;
  role?: string;
  is_admin?: boolean;
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const refetchProfile = () => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Set up realtime subscription for profile updates
    let profileSubscription: any = null;
    if (user?.id) {
      profileSubscription = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new) {
              setProfile(payload.new as Profile);
            }
          }
        )
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [user?.id]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in for:', email);
      
      // Clean up existing state first
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear any existing session to prevent conflicts
      try {
        await supabase.auth.signOut({ scope: 'global' });
        localStorage.removeItem('sb-tndeiiosfbtyzmcwllbx-auth-token');
      } catch (err) {
        console.log('Cleanup error (continuing):', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      console.log('Sign in successful for user:', data.user?.email);
      // Let the auth state change handler take care of the rest
      return { error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Supabase signOut error:', error);
      }
      
      // Clear localStorage manually as backup
      localStorage.removeItem('sb-tndeiiosfbtyzmcwllbx-auth-token');
      
      console.log('Sign out completed, redirecting to home...');
      
      // Use navigate instead of window.location for better UX
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Still redirect even if signout fails
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};