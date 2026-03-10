import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PixelRatio,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AuthBackground } from '../../components/AuthBackground';
import { GlassCard } from '../../components/GlassCard';
import { MagnetParticleButton } from '../../components/MagnetParticleButton';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { DarkColors } from '../../constants/ThemeColors';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const rs = (size: number): number => {
  const { width } = Dimensions.get('window');
  return Math.round(PixelRatio.roundToNearestPixel(size * (width / 390)));
};
const vs = (size: number): number => {
  const { height } = Dimensions.get('window');
  return Math.round(PixelRatio.roundToNearestPixel(size * (height / 844)));
};

const RELATIONSHIP_TYPES = ['Dating', 'Engaged', 'Married', 'Living together', 'Long-distance'];
const DURATIONS = ['< 6 months', '6–12 months', '1–3 years', '3–5 years', '5+ years'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 46 }, (_, i) => currentYear - i);

// ─── FloatingLabelInput ───────────────────────────────────────────
interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  hasError?: boolean;
  maxLength?: number;
  secureTextEntry?: boolean;
}

function FloatingLabelInput({
  label, value, onChangeText,
  isFocused, onFocus, onBlur,
  keyboardType, autoCapitalize, hasError, maxLength, secureTextEntry,
}: FloatingLabelInputProps) {
  const colors = DarkColors;
  const isDark = true;
  const s = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const lineAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: (isFocused || !!value) ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  useEffect(() => {
    Animated.timing(lineAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const labelTop  = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [19, 8] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = isFocused ? colors.accent : colors.textPlaceholder;
  const lineWidth = lineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[
      s.inputWrap,
      isFocused && s.inputWrapFocused,
      hasError  && s.inputWrapError,
    ]}>
      {/* Floating label — absolutely positioned */}
      <Animated.Text
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: rs(16),
          top: labelTop,
          fontSize: labelSize,
          color: labelColor,
          fontFamily: Theme.fonts.body,
          zIndex: 2,
        }}
      >
        {label}
      </Animated.Text>

      {/* Actual input */}
      <TextInput
        style={s.textInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        selectionColor={colors.accent}
        placeholderTextColor="transparent"
      />

      {/* Terracotta bottom line on focus */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          width: lineWidth,
          backgroundColor: colors.accent,
        }}
      />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
// PROFILE SETUP SCREEN
// ═════════════════════════════════════════════════════════════════════
export default function ProfileSetupScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const colors = DarkColors;
  const isDark = true;
  const s = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [displayName, setDisplayName]         = useState('');
  const [age, setAge]                         = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [duration, setDuration]               = useState('');
  const [loading, setLoading]                 = useState(false);
  const [nameError, setNameError]             = useState(false);
  const [focusedField, setFocusedField]       = useState<string | null>(null);

  const [anniversaryMonth, setAnniversaryMonth] = useState<number | null>(null);
  const [anniversaryDay,   setAnniversaryDay]   = useState<number | null>(null);
  const [anniversaryYear,  setAnniversaryYear]  = useState<number | null>(null);
  const [showMonthPicker,  setShowMonthPicker]  = useState(false);
  const [showDayPicker,    setShowDayPicker]    = useState(false);
  const [showYearPicker,   setShowYearPicker]   = useState(false);

  // ─── Entrance animations ──────────────────────────────────────────
  const screenOpacity  = useRef(new Animated.Value(0)).current;
  const ringsScale     = useRef(new Animated.Value(0)).current;
  const ringsRotate    = useRef(new Animated.Value(0)).current;
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const cardY          = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.spring(ringsScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
      Animated.loop(
        Animated.timing(ringsRotate, { toValue: 1, duration: 25000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }, 200);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]).start();
    }, 500);
    setTimeout(() => {
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 800);
  }, []);

  const ringRotStr = ringsRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!displayName.trim()) { setNameError(true); return; }
    setNameError(false);
    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const anniversary = anniversaryMonth && anniversaryDay
        ? `${String(anniversaryMonth).padStart(2,'0')}/${String(anniversaryDay).padStart(2,'0')}${anniversaryYear ? '/' + anniversaryYear : ''}`
        : null;

      const resp = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: user?.id,
          display_name: displayName.trim(),
          age: age ? parseInt(age, 10) : null,
          relationship_type: relationshipType || null,
          together_duration: duration || null,
          anniversary_date: anniversary,
          timezone,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Failed to save profile');
      router.replace('/(auth)/pairing');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Reusable bottom-sheet modal ─────────────────────────────────
  function PickerModal<T>({
    title, visible, onClose, items, selected, onSelect, getLabel,
  }: {
    title: string;
    visible: boolean;
    onClose: () => void;
    items: T[];
    selected: T | null;
    onSelect: (v: T) => void;
    getLabel: (item: T) => string;
  }) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item, idx) => {
              const isSelected = selected === item;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => { onSelect(item); onClose(); }}
                  style={[s.modalRow, isSelected && s.modalRowSelected]}
                >
                  <Text style={[s.modalRowText, isSelected && s.modalRowTextSelected]}>
                    {getLabel(item)}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <AuthBackground>
      <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Logo area ── */}
              <View style={s.logoSection}>
                <Animated.View style={{ transform: [{ scale: ringsScale }, { rotate: ringRotStr }] }}>
                  <Svg width={rs(64)} height={vs(54)} viewBox="0 0 80 68">
                    <Circle cx={30} cy={34} r={24} stroke={colors.accent} strokeWidth={2.5} fill="none" />
                    <Circle cx={50} cy={34} r={24} stroke={colors.accentLight} strokeWidth={2.5} fill="none" />
                  </Svg>
                </Animated.View>
                <Text style={s.logoSubtext}>Almost ready...</Text>
                <View style={s.stepPill}>
                  <Text style={s.stepPillText}>STEP 1 OF 2</Text>
                </View>
              </View>

              {/* ── Glass card ── */}
              <Animated.View style={{
                opacity: cardOpacity,
                transform: [{ translateY: cardY }],
                marginHorizontal: rs(20),
                marginBottom: 40,
              }}>
                <GlassCard alwaysDark>
                  <Animated.View style={{ opacity: contentOpacity }}>

                    <Text style={s.cardTitle}>Tell us about you</Text>
                    <Text style={s.cardSubtitle}>This is how your partner will see you</Text>

                    {/* Avatar */}
                    <TouchableOpacity style={s.avatarWrap} activeOpacity={0.8}>
                      <View style={s.avatarCircle}>
                        <Ionicons name="person-outline" size={36} color={colors.textAccentSoft} />
                      </View>
                      <View style={s.cameraBadge}>
                        <Ionicons name="camera" size={12} color="white" />
                      </View>
                      <Text style={s.avatarLabel}>Add a photo (optional)</Text>
                    </TouchableOpacity>

                    {/* Name */}
                    <View style={{ marginBottom: 6 }}>
                      <FloatingLabelInput
                        label="What should we call you? *"
                        value={displayName}
                        onChangeText={(t) => { setDisplayName(t); setNameError(false); }}
                        isFocused={focusedField === 'name'}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        hasError={nameError}
                        autoCapitalize="words"
                      />
                      {nameError && (
                        <Text style={s.errorText}>Please enter your name to continue</Text>
                      )}
                    </View>
                    <View style={s.privacyRow}>
                      <Ionicons name="eye-outline" size={13} color={colors.textAccentSoft} />
                      <Text style={s.privacyText}>Your partner will see this name</Text>
                    </View>

                    {/* Age */}
                    <View style={{ marginTop: 12, marginBottom: 16 }}>
                      <FloatingLabelInput
                        label="Your age (optional)"
                        value={age}
                        onChangeText={setAge}
                        isFocused={focusedField === 'age'}
                        onFocus={() => setFocusedField('age')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>

                    <View style={s.divider} />

                    {/* Relationship type */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={s.sectionLabel}>RELATIONSHIP TYPE (OPTIONAL)</Text>
                      <View style={s.pillGrid}>
                        {RELATIONSHIP_TYPES.map((t) => (
                          <TouchableOpacity
                            key={t}
                            onPress={() => setRelationshipType(relationshipType === t ? '' : t)}
                            style={[s.pill, relationshipType === t && s.pillActive]}
                          >
                            <Text style={[s.pillText, relationshipType === t && s.pillTextActive]}>{t}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Duration */}
                    <View style={{ marginBottom: 16 }}>
                      <Text style={s.sectionLabel}>HOW LONG TOGETHER (OPTIONAL)</Text>
                      <View style={s.pillGrid}>
                        {DURATIONS.map((d) => (
                          <TouchableOpacity
                            key={d}
                            onPress={() => setDuration(duration === d ? '' : d)}
                            style={[s.pill, duration === d && s.pillActive]}
                          >
                            <Text style={[s.pillText, duration === d && s.pillTextActive]}>{d}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={s.divider} />

                    {/* Anniversary */}
                    <View style={{ marginBottom: 24 }}>
                      <Text style={s.sectionLabel}>ANNIVERSARY (OPTIONAL)</Text>
                      <View style={s.dateRow}>
                        {/* Month */}
                        <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={[s.datePill, { flex: 1 }]}>
                          <Text style={[s.datePillText, anniversaryMonth != null && s.datePillTextFilled]}>
                            {anniversaryMonth != null ? MONTHS[anniversaryMonth - 1] : 'Month'}
                          </Text>
                          <Ionicons name="chevron-down" size={13} color={colors.textPlaceholder} />
                        </TouchableOpacity>
                        {/* Day */}
                        <TouchableOpacity onPress={() => setShowDayPicker(true)} style={[s.datePill, { width: rs(70) }]}>
                          <Text style={[s.datePillText, anniversaryDay != null && s.datePillTextFilled]}>
                            {anniversaryDay ?? 'Day'}
                          </Text>
                          <Ionicons name="chevron-down" size={13} color={colors.textPlaceholder} />
                        </TouchableOpacity>
                        {/* Year */}
                        <TouchableOpacity onPress={() => setShowYearPicker(true)} style={[s.datePill, { width: rs(88) }]}>
                          <Text style={[s.datePillText, anniversaryYear != null && s.datePillTextFilled]}>
                            {anniversaryYear ?? 'Year'}
                          </Text>
                          <Ionicons name="chevron-down" size={13} color={colors.textPlaceholder} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Submit */}
                    <MagnetParticleButton
                      title="Continue to Pairing"
                      onPress={handleSaveProfile}
                      loading={loading}
                    />

                  </Animated.View>
                </GlassCard>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>

      {/* ── Modals ── */}
      <PickerModal
        title="Select Month"
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        items={Array.from({ length: 12 }, (_, i) => i + 1)}
        selected={anniversaryMonth}
        onSelect={setAnniversaryMonth}
        getLabel={(i) => MONTHS[i - 1]}
      />
      <PickerModal
        title="Select Day"
        visible={showDayPicker}
        onClose={() => setShowDayPicker(false)}
        items={DAYS}
        selected={anniversaryDay}
        onSelect={setAnniversaryDay}
        getLabel={(d) => String(d)}
      />
      <PickerModal
        title="Select Year"
        visible={showYearPicker}
        onClose={() => setShowYearPicker(false)}
        items={YEARS}
        selected={anniversaryYear}
        onSelect={setAnniversaryYear}
        getLabel={(y) => String(y)}
      />
    </AuthBackground>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  // Logo
  logoSection: {
    alignItems: 'center',
    paddingTop: vs(60),
    paddingBottom: vs(28),
  },
  logoSubtext: {
    fontFamily: Theme.fonts.heading,
    fontStyle: 'italic',
    fontSize: rs(20),
    color: colors.textSecondary,
    marginTop: 14,
  },
  stepPill: {
    marginTop: 12,
    backgroundColor: isDark ? 'rgba(196,118,74,0.12)' : `${colors.accent}15`,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(196,118,74,0.2)' : `${colors.accent}40`,
  },
  stepPillText: {
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.5,
    fontFamily: Theme.fonts.body,
  },

  // Card
  cardTitle: {
    fontSize: rs(26),
    color: colors.textPrimary,
    fontFamily: Theme.fonts.headingBold,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: rs(13),
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
    marginBottom: 24,
  },

  // Avatar
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: isDark ? 'rgba(196,118,74,0.1)' : `${colors.accent}15`,
    borderWidth: 1.5,
    borderColor: colors.borderAccentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 28,
    right: '32%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  avatarLabel: {
    marginTop: 8,
    fontSize: rs(12),
    color: colors.textMuted,
    fontFamily: Theme.fonts.body,
  },

  // Input
  inputWrap: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.bgInput,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.borderSubtle,
    borderRadius: 16,
    height: vs(60),
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  inputWrapFocused: {
    backgroundColor: isDark ? 'rgba(196,118,74,0.08)' : `${colors.accent}15`,
    borderColor: isDark ? 'rgba(196,118,74,0.4)' : `${colors.accent}50`,
  },
  inputWrapError: {
    borderColor: colors.textDanger,
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: rs(16),
    fontFamily: Theme.fonts.body,
    paddingHorizontal: rs(16),
    paddingTop: vs(22),
    paddingBottom: vs(8),
    backgroundColor: 'transparent',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: rs(11),
    color: colors.textDanger,
    fontFamily: Theme.fonts.body,
  },

  // Privacy hint
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 4,
    marginBottom: 4,
  },
  privacyText: {
    fontSize: rs(11),
    color: colors.textPlaceholder,
    fontFamily: Theme.fonts.body,
    marginLeft: 5,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginVertical: 16,
  },

  // Section labels
  sectionLabel: {
    fontSize: rs(10),
    color: colors.textAccentSoft,
    letterSpacing: 2,
    fontFamily: Theme.fonts.body,
    marginBottom: 10,
  },

  // Wrap pills
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: rs(14),
    paddingVertical: vs(9),
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.bgCardHover,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : colors.borderSubtle,
  },
  pillActive: {
    backgroundColor: isDark ? 'rgba(196,118,74,0.15)' : `${colors.accent}20`,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: rs(13),
    fontFamily: Theme.fonts.body,
    color: colors.textSecondary,
  },
  pillTextActive: {
    fontFamily: Theme.fonts.bodyBold,
    color: colors.accent,
  },

  // Date picker
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.bgInput,
    borderWidth: 1.5,
    borderColor: colors.borderAccentSoft,
    borderRadius: 14,
    paddingHorizontal: rs(10),
    paddingVertical: vs(12),
  },
  datePillText: {
    color: colors.textPlaceholder,
    fontSize: rs(13),
    fontFamily: Theme.fonts.body,
  },
  datePillTextFilled: {
    color: colors.textPrimary,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.borderAccentSoft,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.borderSubtle,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 16,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: rs(16),
    fontFamily: Theme.fonts.headingBold,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  modalRow: {
    paddingVertical: vs(14),
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRowSelected: {
    backgroundColor: colors.bgTagSelected,
  },
  modalRowText: {
    color: colors.textSecondary,
    fontSize: rs(16),
    fontFamily: Theme.fonts.body,
  },
  modalRowTextSelected: {
    color: colors.accent,
    fontFamily: Theme.fonts.bodyBold,
  },
});