import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  PixelRatio,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { AuthBackground } from '../../components/AuthBackground';
import { MagnetParticleButton } from '../../components/MagnetParticleButton';
import { DarkColors } from '../../constants/ThemeColors';

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

// ─── FloatingLabelInput ─────────────────────────────────────────────
interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  leftIcon: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  hasError?: boolean;
}

function FloatingLabelInput({
  label, value, onChangeText, secureTextEntry,
  leftIcon, rightIcon, onRightIconPress,
  isFocused, onFocus, onBlur,
  keyboardType, autoCapitalize, hasError,
}: FloatingLabelInputProps) {
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const lineAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: (isFocused || !!value) ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, labelAnim]);

  useEffect(() => {
    Animated.timing(lineAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused, lineAnim]);

  const labelTop  = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 8] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const lineWidthInterp = lineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const colors = DarkColors;
  const iconColor = (isFocused || !!value) ? colors.accent : colors.textMuted;

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputLeftIcon}>
        <Feather name={leftIcon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Animated.Text
          pointerEvents="none"
          style={[styles.floatingLabel, {
            top: labelTop,
            fontSize: labelSize,
            color: isFocused ? colors.accent : colors.textSecondary,
          }]}
        >
          {label}
        </Animated.Text>
        <TextInput
          style={[styles.darkTextInput, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          selectionColor={colors.accent}
          placeholderTextColor="transparent"
        />
      </View>
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.inputRightIcon}>
          <Feather name={rightIcon} size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
      
      {/* Static Sub-border */}
      <View style={[styles.inputBottomLine, { width: '100%', backgroundColor: 'rgba(184,161,227,0.2)' }]} />
      {/* Animated Focus Border */}
      <Animated.View
        pointerEvents="none"
        style={[styles.inputBottomLine, { backgroundColor: colors.accent, width: lineWidthInterp }]}
      />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
// REGISTER SCREEN
// ═════════════════════════════════════════════════════════════════════
export default function RegisterScreen() {
  const [dims, setDims] = useState(Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);

  const { width: W, height: H } = dims;
  const isSmallScreen = H < 700;

  // ── Logic state ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register } = useAuth();
  const router = useRouter();
  const colors = DarkColors;

  // ── UI state ──
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [secureText, setSecureText] = useState(true);

  // ── Animated values ──
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const ringsScale    = useRef(new Animated.Value(0)).current;
  const ringsRotate   = useRef(new Animated.Value(0)).current;
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const titleY        = useRef(new Animated.Value(-20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity   = useRef(new Animated.Value(0)).current;
  const cardY         = useRef(new Animated.Value(30)).current;
  const cardShakeX    = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(10)).current;
  const input1Opacity = useRef(new Animated.Value(0)).current;
  const input1Y       = useRef(new Animated.Value(8)).current;
  const input2Opacity = useRef(new Animated.Value(0)).current;
  const input2Y       = useRef(new Animated.Value(8)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const signupOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (errorMsg) {
      Animated.sequence([
        Animated.timing(cardShakeX, { toValue:  12, duration: 55, useNativeDriver: true }),
        Animated.timing(cardShakeX, { toValue: -12, duration: 55, useNativeDriver: true }),
        Animated.timing(cardShakeX, { toValue:   8, duration: 55, useNativeDriver: true }),
        Animated.timing(cardShakeX, { toValue:  -8, duration: 55, useNativeDriver: true }),
        Animated.timing(cardShakeX, { toValue:   0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  }, [errorMsg, cardShakeX]);

  useEffect(() => {
    Animated.timing(screenOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.spring(ringsScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
      Animated.loop(
        Animated.timing(ringsRotate, { toValue: 1, duration: 25000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }, 300);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY,       { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 500);

    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]).start();
    }, 800);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 1000);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(input1Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(input1Y,       { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 1100);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(input2Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(input2Y,       { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 1200);

    setTimeout(() => {
      Animated.timing(bottomOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 1300);

    setTimeout(() => {
      Animated.timing(signupOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 1450);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await register(email, password);
      router.replace('/(auth)/pairing');
    } catch (error: any) {
      let msg = error.message || 'Connection failed. Please check your internet and try again.';
      if (msg.includes('network') || msg.includes('timeout') || msg === 'Failed to fetch') {
        msg = 'Connection failed. Please check your internet and try again.';
      }
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const ringRotStr = ringsRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <AuthBackground>
      <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Top 55%: Hero Section */}
              <View style={[styles.heroSection, { minHeight: H * 0.55 }]}>
                <Animated.View style={{ transform: [{ scale: ringsScale }, { rotate: ringRotStr }] }}>
                  <Svg width={rs(80)} height={vs(68)} viewBox="0 0 80 68">
                    <Circle cx={30} cy={34} r={24} stroke={colors.accent} strokeWidth={2.5} fill="none" />
                    <Circle cx={50} cy={34} r={24} stroke={colors.accentLight} strokeWidth={2.5} fill="none" />
                  </Svg>
                </Animated.View>

                <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
                  <MaskedView maskElement={<Text style={[styles.appName, { fontSize: rs(isSmallScreen ? 40 : 52) }]}>MoodRings</Text>}>
                    <LinearGradient colors={['#A18CD1', '#FBC2EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Text style={[styles.appName, { fontSize: rs(isSmallScreen ? 40 : 52), opacity: 0 }]}>MoodRings</Text>
                    </LinearGradient>
                  </MaskedView>
                </Animated.View>

                <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, fontSize: rs(9), color: colors.textAccentSoft }]}>
                  YOUR SHARED EMOTIONAL SPACE
                </Animated.Text>
              </View>

              {/* Bottom 45%: Form Section */}
              <View style={[styles.formSection, { minHeight: H * 0.45 }]}>
                <LinearGradient
                  colors={['rgba(26,27,47,0)', 'rgba(26,27,47,1)']}
                  locations={[0, 0.15]}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />

                <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardY }, { translateX: cardShakeX }], paddingHorizontal: rs(28), paddingTop: 16 }}>
                  <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerY }] }}>
                    <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>Create account</Text>
                    <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Start your shared journey</Text>
                  </Animated.View>

                  <Animated.View style={{ opacity: input1Opacity, transform: [{ translateY: input1Y }] }}>
                    <FloatingLabelInput
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      leftIcon="mail"
                      isFocused={focusedField === 'email'}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      hasError={!!errorMsg}
                    />
                  </Animated.View>

                  <Animated.View style={{ opacity: input2Opacity, transform: [{ translateY: input2Y }] }}>
                    <FloatingLabelInput
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      leftIcon="lock"
                      rightIcon={secureText ? 'eye' : 'eye-off'}
                      onRightIconPress={() => setSecureText(s => !s)}
                      secureTextEntry={secureText}
                      isFocused={focusedField === 'password'}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      hasError={!!errorMsg}
                    />
                  </Animated.View>

                  <Animated.View style={{ opacity: bottomOpacity }}>
                    {errorMsg && (
                      <View style={[styles.errorPill, { borderColor: colors.borderDanger, backgroundColor: colors.bgDanger }]}>
                        <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{errorMsg}</Text>
                      </View>
                    )}

                    <MagnetParticleButton
                      title="Create Account"
                      onPress={handleRegister}
                      loading={loading}
                      gradientColors={['#B8A1E3', '#F7A6C4']}
                      style={{ marginTop: errorMsg ? 8 : 24 }}
                    />
                  </Animated.View>

                  <Animated.View style={{ opacity: signupOpacity }}>
                    <Link href="/(auth)/login" asChild>
                      <TouchableOpacity style={styles.signupLink}>
                        <Text style={[styles.signupText, { color: colors.textSecondary }]}>
                          Already have an account? <Text style={[styles.signupTextBold, { color: colors.accent }]}>Log In</Text>
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </Animated.View>
                </Animated.View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    width: '100%',
  },
  appName: {
    fontFamily: Theme.fonts.headingBold,
    letterSpacing: -1.5,
    marginTop: 12,
  },
  tagline: {
    fontFamily: Theme.fonts.headingBold,
    letterSpacing: 4,
    marginTop: 4,
  },
  welcomeTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    marginBottom: 32,
  },
  inputContainer: {
    height: 64,
    marginBottom: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLeftIcon: {
    width: 32,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRightIcon: {
    padding: 8,
    marginLeft: 4,
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontFamily: Theme.fonts.body,
  },
  darkTextInput: {
    flex: 1,
    fontSize: 16,
    paddingTop: 18,
    paddingBottom: 4,
    fontFamily: Theme.fonts.body,
  },
  inputBottomLine: {
    position: 'absolute',
    bottom: 0, left: 0,
    height: 1.5,
    borderRadius: 1,
  },
  errorPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    marginTop: 8,
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
  },
  signupTextBold: {
    fontFamily: Theme.fonts.bodyBold,
  },
});
