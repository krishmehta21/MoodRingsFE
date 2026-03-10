import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  PixelRatio,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthBackground } from '../../components/AuthBackground';
import { MagnetParticleButton } from '../../components/MagnetParticleButton';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { DarkColors } from '../../constants/ThemeColors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── Responsiveness ─────────────────────────────────────────────────
const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

const rs = (size: number): number => {
  const { width } = Dimensions.get('window');
  return Math.round(PixelRatio.roundToNearestPixel(size * (width / BASE_WIDTH)));
};

const vs = (size: number): number => {
  const { height } = Dimensions.get('window');
  return Math.round(PixelRatio.roundToNearestPixel(size * (height / BASE_HEIGHT)));
};

// ─── Twin Rings Logo Hero ──────────────────────────────────────────
function TwinRingsHero({
  ringsScale, ringRotStr, titleOpacity, titleY, taglineOpacity
}: any) {
  const { height } = Dimensions.get('window');
  const isSmallScreen = height < 700;
  const colors = DarkColors;

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, { minHeight: height * 0.55 }]}>
      {/* Centralized the animated twin rings Svg with a pulsing lavender glow */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {/* Synthetic Back Glow Array */}
        <Animated.View style={[{
            position: 'absolute',
            width: rs(120), height: rs(120), borderRadius: rs(60),
            backgroundColor: 'rgba(184,161,227,0.15)',
            transform: [{ scale: ringsScale }],
        }]} />
        <Animated.View style={{ transform: [{ scale: ringsScale }, { rotate: ringRotStr }] }}>
          <Svg width={rs(80)} height={vs(68)} viewBox="0 0 80 68">
            <Circle cx={30} cy={34} r={24} stroke={colors.accent} strokeWidth={2.5} fill="none" />
            <Circle cx={50} cy={34} r={24} stroke={colors.accentLight} strokeWidth={2.5} fill="none" />
          </Svg>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], marginTop: 24 }}>
        <Text style={{ 
          fontFamily: Theme.fonts.headingBold, 
          fontSize: rs(isSmallScreen ? 28 : 32), 
          color: colors.textPrimary,
          textAlign: 'center',
          letterSpacing: -0.5,
          paddingHorizontal: 20
        }}>
          Connect with your person
        </Text>
      </Animated.View>

      <Animated.Text style={{
        opacity: taglineOpacity,
        fontFamily: Theme.fonts.body,
        fontSize: rs(15),
        color: colors.textSecondary,
        marginTop: 12,
        textAlign: 'center'
      }}>
        Share your code or enter theirs
      </Animated.Text>
    </View>
  );
}

// ─── OTP Split Input Array ─────────────────────────────────────────
function OTPInputArray({ value, setValue, colors }: any) {
  // 6 digit nodes
  const inputs = useRef<TextInput[]>([]);

  const handleTextChange = (text: string, index: number) => {
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Replace char at the active index
    const arr = value.split('');
    arr[index] = cleanText;
    const finalVal = arr.join('').substring(0, 6);
    setValue(finalVal);

    if (cleanText && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      // Step back precisely when encountering empty bounds
      inputs.current[index - 1]?.focus();
      
      const arr = value.split('');
      arr[index - 1] = '';
      setValue(arr.join(''));
    }
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const char = value[i] || '';
        const isFilled = char.length > 0;
        
        return (
          <View 
            key={i} 
            style={{ 
              flex: 1, 
              maxWidth: 48, 
              aspectRatio: 3/4, 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: 12, 
              backgroundColor: isFilled ? 'rgba(184,161,227,0.12)' : 'rgba(184,161,227,0.08)', 
              borderWidth: 1.5, 
              borderColor: isFilled ? colors.accent : 'rgba(184,161,227,0.3)',
              // Glow effect when filled
              shadowColor: isFilled ? colors.accent : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isFilled ? 0.5 : 0,
              shadowRadius: 8,
              elevation: isFilled ? 4 : 0,
            }}
          >
            <TextInput
              ref={(ref) => {
                if (ref) inputs.current[i] = ref;
              }}
              style={{
                textAlign: 'center',
                fontFamily: Theme.fonts.headingBold,
                fontSize: 26,
                color: colors.textPrimary,
                width: '100%',
                height: '100%'
              }}
              value={char}
              onChangeText={(t) => handleTextChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              maxLength={1}
              autoCapitalize="characters"
              autoCorrect={false}
              selectionColor={colors.accent}
              keyboardType="default"
              placeholderTextColor="transparent"
            />
          </View>
        );
      })}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
// PAIRING SCREEN (Full-Screen Split, No GlassCard)
// ═════════════════════════════════════════════════════════════════════
export default function PairingScreen() {
  const { user, token, updateUser } = useAuth();
  const colors = DarkColors;
  const router = useRouter();

  const [dims, setDims] = useState(Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);
  const { width: W, height: H } = dims;

  // ── Mode Toggle state ──
  // Replaced multiple discrete 'choice' layers with a pure tab toggle: 'share' | 'enter'
  const [activeTab, setActiveTab]     = useState<'share' | 'enter'>('share');
  const [inviteCode, setInviteCode]   = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [expiresAt, setExpiresAt]     = useState<string | null>(null);

  // Timer logic for invite code expiration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'share' && inviteCode && expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diff);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, inviteCode, expiresAt]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      // HH:MM format for more than an hour
      return `Expires in ${hrs}:${mins.toString().padStart(2, '0')}`;
    } else {
      // MM:SS format for under an hour
      return `Expires in ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Initialize Share code eagerly on mount since tab 1 defaults to visible
  useEffect(() => {
    if (activeTab === 'share' && !inviteCode && user) {
      handleGenerateCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const handleGenerateCode = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/auth/generate-code?user_id=${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (resp.status === 200 && data.message === 'You are already linked to a partner.') {
        Alert.alert('Already Linked', "You're already connected to a partner.", [{ text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') }]);
        return;
      }
      if (!resp.ok) throw new Error(data.detail || 'Failed to generate code.');
      if (!data.invite_code) throw new Error('No invite code returned. Please try again.');
      setInviteCode(data.invite_code);
      if (data.expires_at) {
        setExpiresAt(data.expires_at);
      }
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('network') || e.message?.toLowerCase().includes('fetch')) {
        Alert.alert('Connection Error', "Can't reach the server.", [{ text: 'OK' }]);
      } else {
        Alert.alert("Couldn't Generate Code", e.message || 'Something went wrong.', [{ text: 'OK' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPartner = async () => {
    if (!user) { Alert.alert('Not signed in', 'Please sign in before linking.'); return; }
    if (!partnerCode || partnerCode.length < 6) return;
    
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/auth/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: user.id, invite_code: partnerCode }),
      });
      const data = await resp.json();
      if (resp.status === 404) { Alert.alert("Code Not Found", "That invite code doesn't match anyone."); return; }
      if (resp.status === 400 && data.detail?.includes('yourself')) { Alert.alert("Nice try 😄", "You can't link to your own account."); return; }
      if (resp.status === 400 && data.detail?.includes('already linked')) { Alert.alert('Already Linked', 'One or both accounts are already connected.'); return; }
      if (!resp.ok) throw new Error(data.detail || 'Linking failed.');
      await updateUser({ partner_id: data.partner.id });
      setSuccess(true);
      setTimeout(() => router.replace('/(tabs)'), 3000);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('network') || e.message?.toLowerCase().includes('fetch')) {
        Alert.alert('Connection Error', "Can't reach the server.", [{ text: 'OK' }]);
      } else {
        Alert.alert('Linking Failed', e.message || 'Something went wrong.', [{ text: 'OK' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    if (!inviteCode) return;
    try { await Share.share({ message: `Join me on MoodRings! Use my invite code: ${inviteCode}` }); }
    catch (e: any) { Alert.alert('Share Failed', e.message); }
  };

  // ── Animations ──
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const ringsScale    = useRef(new Animated.Value(0)).current;
  const ringsRotate   = useRef(new Animated.Value(0)).current;
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const titleY        = useRef(new Animated.Value(-10)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity   = useRef(new Animated.Value(0)).current;
  const formY         = useRef(new Animated.Value(20)).current;
  const tabSlideAnim  = useRef(new Animated.Value(0)).current;

  // Watch tab change to trigger slide
  useEffect(() => {
    Animated.timing(tabSlideAnim, {
      toValue: activeTab === 'share' ? 0 : 1,
      duration: 400,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    Animated.timing(screenOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    
    setTimeout(() => {
      Animated.spring(ringsScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
      Animated.loop(
        Animated.timing(ringsRotate, { toValue: 1, duration: 25000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 450);

    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]).start();
    }, 750);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringRotStr = ringsRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Success screen ──
  if (success) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Animated.View style={{ alignItems: 'center' }}>
              <Ionicons name="sparkles" size={80} color={colors.accent} />
              <Text style={{ fontFamily: Theme.fonts.headingBold, fontSize: 40, color: colors.accent, marginTop: 20 }}>Connected!</Text>
              <Text style={{ fontFamily: Theme.fonts.body, fontSize: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 26 }}>You and your partner are now synced. Welcome to MoodRings together.</Text>
              <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
            </Animated.View>
          </View>
        </SafeAreaView>
      </AuthBackground>
    );
  }

  // Effect triggering auto-link upon reaching length 6
  useEffect(() => {
    if (activeTab === 'enter' && partnerCode.length === 6) {
      handleLinkPartner();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerCode, activeTab]);


  return (
    <AuthBackground>
      <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              
              {/* TOP 55%: Emotional Hero Component */}
              <TwinRingsHero
                ringsScale={ringsScale}
                ringRotStr={ringRotStr}
                titleOpacity={titleOpacity}
                titleY={titleY}
                taglineOpacity={taglineOpacity}
              />

              {/* BOTTOM 45%: Tabbed Form Form */}
              <View style={{ minHeight: H * 0.45, width: '100%', paddingHorizontal: 24, paddingTop: 16 }}>
                
                {/* Absolute Gradient Anchor mapping the #1A1B2F convergence overlay */}
                <LinearGradient
                  colors={['rgba(26,27,47,0)', 'rgba(26,27,47,1)']}
                  locations={[0, 0.2]}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />

                <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formY }], flex: 1 }}>
                  
                  {/* Segmented Controls */}
                  <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 100, padding: 4, marginBottom: 32 }}>
                    <TouchableOpacity
                      onPress={() => setActiveTab('share')}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 100, backgroundColor: activeTab === 'share' ? 'rgba(255,255,255,0.1)' : 'transparent', alignItems: 'center' }}
                    >
                      <Text style={{ fontFamily: activeTab === 'share' ? Theme.fonts.bodyBold : Theme.fonts.body, color: activeTab === 'share' ? colors.textPrimary : colors.textMuted }}>Your Code</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setActiveTab('enter')}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 100, backgroundColor: activeTab === 'enter' ? 'rgba(255,255,255,0.1)' : 'transparent', alignItems: 'center' }}
                    >
                      <Text style={{ fontFamily: activeTab === 'enter' ? Theme.fonts.bodyBold : Theme.fonts.body, color: activeTab === 'enter' ? colors.textPrimary : colors.textMuted }}>Partner's Code</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ overflow: 'hidden' }}>
                    <Animated.View style={{ 
                      flexDirection: 'row', 
                      width: '200%',
                      transform: [{ 
                        translateX: tabSlideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -(W - 48)] // Adjusted for padding
                        }) 
                      }]
                    }}>
                      {/* ACTIVE TAB: SHARE */}
                      <View style={{ width: W - 48, alignItems: 'center' }}>
                        {/* Character Display Row */}
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, paddingHorizontal: 16 }}>
                          {[0, 1, 2, 3, 4, 5].map((idx) => {
                            const charStr = inviteCode[idx] || '';
                            const isFilled = charStr.length > 0;
                            return (
                              <View 
                                key={idx} 
                                style={{ 
                                  flex: 1, 
                                  maxWidth: 48, 
                                  aspectRatio: 3/4, 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  borderRadius: 12, 
                                  backgroundColor: isFilled ? 'rgba(184,161,227,0.12)' : 'rgba(184,161,227,0.08)', 
                                  borderWidth: 1.5, 
                                  borderColor: isFilled ? colors.accent : 'rgba(184,161,227,0.3)',
                                  // Glow effect
                                  shadowColor: isFilled ? colors.accent : 'transparent',
                                  shadowOffset: { width: 0, height: 0 },
                                  shadowOpacity: isFilled ? 0.5 : 0,
                                  shadowRadius: 8,
                                  elevation: isFilled ? 4 : 0,
                                }}
                              >
                                <MaskedView maskElement={<Text style={{ fontSize: 26, fontFamily: Theme.fonts.headingBold }}>{charStr}</Text>}>
                                  <LinearGradient colors={['#B8A1E3', '#F7A6C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <Text style={{ fontSize: 26, fontFamily: Theme.fonts.headingBold, opacity: charStr ? 0 : 1 }}>{charStr}</Text>
                                  </LinearGradient>
                                </MaskedView>
                              </View>
                            );
                          })}
                        </View>

                        {/* Display Action Flow */}
                        {loading ? (
                          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
                        ) : (
                          <MagnetParticleButton title="Share Code" onPress={onShare} gradientColors={['#B8A1E3', '#F7A6C4']} style={{ width: '100%', marginBottom: 16 }} />
                        )}

                        <Text style={{ fontFamily: Theme.fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
                          {formatTime(timeLeft)}
                        </Text>
                      </View>

                      {/* ACTIVE TAB: ENTER */}
                      <View style={{ width: W - 48 }}>
                        {/* Auto-focusing OTP Grid */}
                        <OTPInputArray value={partnerCode} setValue={setPartnerCode} colors={colors} />

                        <View style={{ marginTop: 32 }}>
                          <MagnetParticleButton
                            title="Link Us 💗"
                            onPress={handleLinkPartner}
                            loading={loading}
                            disabled={partnerCode.length < 6 || loading}
                            gradientColors={partnerCode.length === 6 ? ['#B8A1E3', '#F7A6C4'] : ['rgba(184,161,227,0.4)', 'rgba(247,166,196,0.4)']}
                          />
                        </View>
                      </View>
                    </Animated.View>
                  </View>

                  {/* BOTTOM ANCHOR INFO */}
                  <View style={{ flex: 1, justifyContent: 'flex-end', marginTop: 40 }}>
                    <Text style={{ textAlign: 'center', color: colors.textSecondary, fontFamily: Theme.fonts.body, fontSize: 13, marginBottom: 12 }}>
                      Both of you need to be signed in
                    </Text>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ paddingVertical: 8, alignItems: 'center' }}>
                      <Text style={{ fontFamily: Theme.fonts.body, fontSize: 13, color: colors.textMuted }}>Skip for now</Text>
                    </TouchableOpacity>
                  </View>

                </Animated.View>
              </View>
              
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </AuthBackground>
  );
}