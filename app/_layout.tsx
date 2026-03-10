import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Animated } from 'react-native';
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

const ONBOARDING_KEY = 'moodrings_onboarded';

export const triggerOnboardingRefresh = { fn: () => {} };

function InitialLayout() {
  const { isLoading, token, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

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
    
    // Keep-alive ping to wake up Render server
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`).catch(() => {});
  }, []);

  useEffect(() => {
    // Wait until everything is ready
    if (isLoading || !fontsLoaded || hasSeenOnboarding === null) return;

    SplashScreen.hideAsync();

    const currentSegment = segments.join('/');

    // ── Determine where we SHOULD be ────────────────────────────────────────
    let target: string;

    if (!token && navigationTarget.current === '/(tabs)') {
      navigationTarget.current = null;
    }

    if (!token) {
      // Not logged in
      if (!hasSeenOnboarding) {
        target = '/(auth)/onboarding';
      } else {
        target = '/(auth)/login';
      }
    } else {
      // Logged in
      if (!user?.profile_complete) {
        target = '/(auth)/profile-setup';
      } else if (!user?.partner_id) {
        target = '/(auth)/pairing';
      } else {
        target = '/(tabs)';
      }
    }

    // ── Only navigate if we're not already there ─────────────────────────
    if (navigationTarget.current === target) return;

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

  }, [isLoading, fontsLoaded, hasSeenOnboarding, token, user]);

  useEffect(() => {
    if (!token) {
      navigationTarget.current = null;
    }
  }, [token]);

  const { isDark, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevIsDark = useRef(isDark);

  useEffect(() => {
    if (prevIsDark.current !== isDark) {
      prevIsDark.current = isDark;
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDark]);

  if (isLoading || !fontsLoaded || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </Animated.View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}