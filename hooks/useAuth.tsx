import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  initialized: boolean;
};

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  initialized: false 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
    const demoUserId = process.env.EXPO_PUBLIC_DEMO_USER_ID;

    if (demoMode && demoUserId) {
      const mockUser = {
        id: demoUserId,
        email: 'demo@moodrings.app',
      } as any;
      setUser(mockUser);
      setInitialized(true);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (process.env.EXPO_PUBLIC_DEMO_MODE === 'true') return;
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
