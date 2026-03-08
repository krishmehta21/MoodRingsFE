import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  PlayfairDisplay_400Regular, 
  PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'moodrings_has_seen_onboarding';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

function InitialLayout() {
  const { initialized, session, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(val === 'true');
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    const checkPartner = async () => {
      if (!session?.user?.id) {
        console.log('[Layout] No session — hasPartner = false');
        setHasPartner(false);
        return;
      }
      console.log('[Layout] Checking partner for user ID:', session.user.id);
      console.log('[Layout] API_URL:', API_URL);
      try {
        const url = `${API_URL}/auth/me?user_id=${session.user.id}`;
        console.log('[Layout] Fetching:', url);
        const resp = await fetch(url);
        const data = await resp.json();
        console.log('[Layout] /auth/me response:', JSON.stringify(data));
        setHasPartner(!!data.partner_id);
      } catch (e) {
        console.log('[Layout] checkPartner fetch error:', e);
        setHasPartner(false);
      }
    };
    checkPartner();
  }, [session]);

  useEffect(() => {
    if (!initialized || !fontsLoaded || hasSeenOnboarding === null || hasPartner === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isPairing = (segments as any[]).includes('pairing');
    const isOnboarding = (segments as any[]).includes('onboarding');

    console.log('[Layout] Routing — hasPartner:', hasPartner, '| inAuthGroup:', inAuthGroup, '| isPairing:', isPairing, '| session:', !!session);

    if (!session) {
      if (!hasSeenOnboarding && !isOnboarding) {
        router.replace('/(auth)/onboarding');
      } else if (hasSeenOnboarding && !inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (!hasPartner && !isPairing && !isOnboarding) {
        router.replace('/(auth)/pairing');
      } else if (hasPartner && inAuthGroup) {
        router.replace('/(tabs)');
      }
    }

    SplashScreen.hideAsync();
  }, [session, initialized, segments, fontsLoaded, hasSeenOnboarding, hasPartner]);

  if (!initialized || !fontsLoaded || hasSeenOnboarding === null || hasPartner === null) {
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