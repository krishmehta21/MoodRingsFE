import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log('[useAuth] API_URL resolved as:', API_URL);

// Fire-and-forget server warmup so Render wakes up before user hits Login
const warmUpServer = async () => {
  try {
    await fetch(`${API_URL}/health`, { method: 'GET' });
    console.log('[useAuth] Server warmup ping sent');
  } catch {
    console.log('[useAuth] Server warmup ping failed (server may be sleeping)');
  }
};

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
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  login: async () => ({} as User),
  register: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

const fetchWithTimeout = async (url: string, options: any, timeoutMs = 60000) => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    ),
  ]);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Warm up Render server immediately on app open
    warmUpServer();

    const loadSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedUserStr = await SecureStore.getItemAsync('current_user');

        if (storedToken && storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);

          try {
            const resp = await fetchWithTimeout(
              `${API_URL}/auth/me?user_id=${storedUser.id}`,
              { headers: { Authorization: `Bearer ${storedToken}` } },
              3000
            );

            if (resp.ok) {
              const data = await resp.json();
              if (isMounted) {
                setToken(storedToken);
                setUser(data);
                await SecureStore.setItemAsync('current_user', JSON.stringify(data));
              }
            } else {
              if (isMounted) {
                setToken(null);
                setUser(null);
              }
              await SecureStore.deleteItemAsync('auth_token').catch(() => {});
              await SecureStore.deleteItemAsync('current_user').catch(() => {});
            }
          } catch {
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

    // Absolute 3s max so loading never hangs forever
    const absoluteTimeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 3000);

    loadSession();

    return () => {
      isMounted = false;
      clearTimeout(absoluteTimeout);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const url = `${API_URL}/auth/login`;
    console.log('[login] Starting request to:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for cold start

    let resp;
    try {
      console.log('[login] Firing fetch...');
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      console.log('[login] Response received. Status:', resp.status);
    } catch (error: any) {
      console.log('[login] Fetch threw error:', error.name, error.message);
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('Request timed out. The server may be waking up — please try again.');
      throw new Error(`Network error: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      console.log('[login] Non-OK response:', resp.status, errorData);
      throw new Error(errorData.detail || `Server error: ${resp.status}`);
    }

    const data = await resp.json();
    console.log('[login] Success. User:', data.user?.email, 'partner_id:', data.user?.partner_id);

    setToken(data.access_token);
    setUser(data.user);
    await SecureStore.setItemAsync('auth_token', data.access_token);
    await SecureStore.setItemAsync('current_user', JSON.stringify(data.user));

    return data.user;
  };

  const register = async (email: string, password: string) => {
    const resp = await fetchWithTimeout(
      `${API_URL}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      60000 // 60s for cold start
    );

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
    await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    await SecureStore.deleteItemAsync('current_user').catch(() => {});
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