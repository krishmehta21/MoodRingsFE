import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Make sure this matches your environment's URL logic
const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log('[useAuth] API_URL resolved as:', API_URL);

export type User = {
  id: string;
  email?: string;
  partner_id?: string | null;
  profile_complete?: boolean;
  display_name?: string;
  [key: string]: any;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  token: null, 
  user: null, 
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

const fetchWithTimeout = async (url: string, options: any, timeoutMs = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    )
  ]);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedUserStr = await SecureStore.getItemAsync('current_user');

        if (storedToken && storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          
          // Verify with backend
          try {
            const resp = await fetchWithTimeout(`${API_URL}/auth/me?user_id=${storedUser.id}`, {
              headers: { 'Authorization': `Bearer ${storedToken}` }
            }, 3000); // 3-second timeout for boot fetch

            if (resp.ok) {
              const data = await resp.json();
              if (isMounted) {
                setToken(storedToken);
                setUser(data);
                await SecureStore.setItemAsync('current_user', JSON.stringify(data));
              }
            } else {
              // If token invalid/401, clear storage
              if (isMounted) {
                setToken(null);
                setUser(null);
              }
              await SecureStore.deleteItemAsync('auth_token').catch(() => {});
              await SecureStore.deleteItemAsync('current_user').catch(() => {});
            }
          } catch (e) {
            // Network fallback: trust local cache so user isn't stuck offline
            if (isMounted) {
              setToken(storedToken);
              setUser(storedUser);
            }
          }
        } else {
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // 3-second absolute maximum timeout to guarantee isLoading becomes false
    const absoluteTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        setIsLoading(false);
      }
    }, 3000);

    loadSession();

    return () => {
      isMounted = false;
      clearTimeout(absoluteTimeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    let resp;
    try {
      resp = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    } catch (error: any) {
      if (error.name === 'AbortError') throw new Error('timeout');
      throw error;
    }
    
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }
    
    const data = await resp.json();
    setToken(data.access_token);
    setUser(data.user);
    
    await SecureStore.setItemAsync('auth_token', data.access_token);
    await SecureStore.setItemAsync('current_user', JSON.stringify(data.user));
  };

  const register = async (email: string, password: string) => {
    const resp = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed');
    }
    
    const data = await resp.json();
    setToken(data.access_token);
    setUser(data.user);
    
    await SecureStore.setItemAsync('auth_token', data.access_token);
    await SecureStore.setItemAsync('current_user', JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    } catch {}
    try {
      await SecureStore.deleteItemAsync('current_user').catch(() => {});
    } catch {}
    
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  };

  const updateUser = async (newData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...newData };
    setUser(updated);
    await SecureStore.setItemAsync('current_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
