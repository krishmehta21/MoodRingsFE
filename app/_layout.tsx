import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'moodrings_has_seen_onboarding';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

export const triggerOnboardingRefresh = { fn: () => {} };

function InitialLayout() {
  const { initialized, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  // ── Guard: only navigate once per logical state change ───────────────────
  // Without this, every segment change re-triggers navigation → infinite loop
  const navigationTarget = useRef<string | null>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    const load = async () => {
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(val === 'true');
    };
    load();
    triggerOnboardingRefresh.fn = load;
  }, []);

  useEffect(() => {
    const checkPartner = async () => {
      if (!session?.user?.id) {
        setHasPartner(false);
        return;
      }
      try {
        const resp = await fetch(`${API_URL}/auth/me?user_id=${session.user.id}`);
        if (!resp.ok) {
           if (resp.status === 404) {
             supabase.auth.signOut();
           }
           return;
        }
        const data = await resp.json();
        setHasPartner(!!data.partner_id);
        setProfileComplete(!!data.profile_complete);
      } catch {
        // network error, retain current state
      }
    };
    checkPartner();
  }, [session]);

  // Continuously poll partner status so if the other user deletes/unlinks
  // we are automatically kicked back to the pairing screen
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (session?.user?.id && hasPartner) {
      interval = setInterval(async () => {
        try {
          const resp = await fetch(`${API_URL}/auth/me?user_id=${session.user.id}`);
          if (resp.ok) {
            const data = await resp.json();
            if (!data.partner_id) {
              setHasPartner(false);
            }
          } else if (resp.status === 404) {
             supabase.auth.signOut();
          }
        } catch { }
      }, 5000); // Check every 5 seconds
    }
    
    return () => clearInterval(interval);
  }, [session, hasPartner]);

  useEffect(() => {
    // Wait until everything is ready
    if (
      !initialized ||
      !fontsLoaded ||
      hasSeenOnboarding === null ||
      (session && (hasPartner === null || profileComplete === null))
    ) return;

    SplashScreen.hideAsync();

    const currentSegment = segments.join('/');

    // ── Determine where we SHOULD be ────────────────────────────────────────
    let target: string;

    if (!session && navigationTarget.current === '/(tabs)') {
      navigationTarget.current = null;
    }

    if (!session) {
      // Not logged in
      if (!hasSeenOnboarding) {
        target = '/(auth)/onboarding';
      } else {
        target = '/(auth)/login';
      }
    } else {
      // Logged in
      if (!profileComplete) {
        target = '/(auth)/profile-setup';
      } else if (!hasPartner) {
        target = '/(auth)/pairing';
      } else {
        target = '/(tabs)';
      }
    }

    // ── Only navigate if we're not already there ─────────────────────────
    // This prevents the infinite loop — we track where we last sent the user
    // and skip if it's the same destination
    if (navigationTarget.current === target) return;

    // Also skip if the current screen already matches the target group
    const alreadyThere =
      (target === '/(tabs)' && currentSegment.startsWith('(tabs)')) ||
      (target === '/(auth)/onboarding' && currentSegment.includes('onboarding')) ||
      (target === '/(auth)/login' && currentSegment.includes('login')) ||
      (target === '/(auth)/profile-setup' && currentSegment.includes('profile-setup')) ||
      (target === '/(auth)/pairing' && currentSegment.includes('pairing'));

    if (alreadyThere) return;

    console.log('[Layout] Navigating to:', target);
    navigationTarget.current = target;
    router.replace(target as any);

  }, [initialized, fontsLoaded, hasSeenOnboarding, hasPartner, profileComplete, session]); // Removed segments from dependency array

  useEffect(() => {
    if (!session) {
      navigationTarget.current = null;
      setProfileComplete(null);
      setHasPartner(null);
    }
  }, [session]);

  if (
    !initialized ||
    !fontsLoaded ||
    hasSeenOnboarding === null ||
    (session && (hasPartner === null || profileComplete === null))
  ) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' }}>
        <ActivityIndicator size="large" color="#C4764A" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}