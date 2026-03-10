import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  PixelRatio,
  Animated,
  Easing,
} from 'react-native';
import { MoodLineChart } from '../../components/MoodLineChart';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { MagnetParticleButton } from '../../components/MagnetParticleButton';
import { GlassCard } from '../../components/GlassCard';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width: W } = Dimensions.get('window');

const rs = (size: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel(size * (W / 390)));
};

const getGreetingCopy = (name: string) => {
  const hour = new Date().getHours();
  const firstName = name ? name.split(' ')[0] : 'there';
  if (hour < 12) return `Good morning, ${firstName} ☀️`;
  if (hour < 17) return `Good afternoon, ${firstName} 🌿`;
  return `Good evening, ${firstName} 🌙`;
};

const getEmotionColor = (score: number | null, tags: string[], colors: any): string => {
  if (tags && tags.length > 0) {
    const t = tags[0].toLowerCase();
    if (t === 'happy') return colors.chartHappy;
    if (t === 'calm') return colors.chartCalm;
    if (t === 'loved') return colors.chartLoved;
    if (t === 'sad') return colors.chartSad;
    if (t === 'stressed' || t === 'angry' || t === 'frustrated') return colors.chartAngry;
    if (t === 'grateful') return '#B5EAD7';
    if (t === 'anxious') return '#FFDAC1';
  }
  if (score === null) return colors.textPlaceholder;
  if (score >= 8) return colors.chartHappy;
  if (score >= 6) return colors.chartCalm;
  if (score >= 4) return colors.chartSad;
  return colors.chartAngry;
};

const getRiskIcon = (pct: number): any => {
  if (pct < 40) return 'heart';
  if (pct < 70) return 'alert-circle-outline';
  return 'warning-outline';
};

const getMoodEmoji = (score: number | null) => {
  if (score === null) return '—';
  if (score <= 2) return '😔';
  if (score <= 4) return '😕';
  if (score <= 6) return '😐';
  if (score <= 8) return '🙂';
  return '😊';
};

const formatFeatureName = (key: string, value: number) => {
  switch (key) {
    case 'mood_delta_7d':
      return `Mood divergence (${value.toFixed(1)} points gap)`;
    case 'streak_broken':
      return `Missed logging days`;
    case 'sentiment_trend':
      return value < 0 ? `Negative journal sentiment` : `Journal sentiment shift`;
    case 'volatility_score':
      return `High mood volatility`;
    case 'low_score_overlap':
      return `Concurrent low moods (${value} days)`;
    case 'response_lag_hours':
      return `Delayed responses (${value.toFixed(1)}h avg lag)`;
    case 'calendar_stress':
      return `Heavy calendar load`;
    default:
      return key.replace(/_/g, ' ');
  }
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const ds = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestionCompleted, setSuggestionCompleted] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${API_URL}/dashboard?user_id=${user.id}`);
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.detail || 'Failed to fetch data');
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [user]));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSuggestionComplete = async () => {
    if (!user || !data?.suggestion?.id) return;
    try {
      const resp = await fetch(`${API_URL}/suggestions/${data.suggestion.id}/acted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      if (resp.ok) setSuggestionCompleted(true);
    } catch (e) {
      console.error("Failed to mark suggestion as completed", e);
    }
  };

  // ── Empty state Redesign ──────────────────────────────────────────────────────────
  const hasLogs = data?.me?.last_7_days?.length > 0 || data?.partner?.last_7_days?.length > 0;
  if (!loading && data && !hasLogs) {
    return (
      <DarkBackground>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ alignItems:'center', paddingTop: 60, paddingBottom: 40 }}>
            {/* Large rose ring icon */}
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              borderWidth: 2, borderColor: colors.borderAccent,
              alignItems:'center', justifyContent:'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 32 }}>💞</Text>
            </View>
            
            <Text style={{ 
              color: colors.chartUser, fontSize: 18, fontWeight: '600',
              marginBottom: 8, textAlign: 'center'
            }}>
              {!user?.partner_id ? 'Link your partner' : 'Start logging'}
            </Text>
            
            <Text style={{
              color: colors.textMuted, fontSize: 14, 
              textAlign: 'center', lineHeight: 20, maxWidth: 260,
              marginBottom: 32
            }}>
              {!user?.partner_id 
                ? 'Connect with your partner to see your shared dashboard'
                : 'Log your first mood to see your relationship trends'}
            </Text>
            
            <View style={{ width: 220, marginTop: 8 }}>
              {/* CTA button - same gradient style */}
              <MagnetParticleButton
                title={!user?.partner_id ? 'Go to Pairing' : 'Log My Mood'}
                onPress={() => router.push((!user?.partner_id ? '/(auth)/pairing' : '/(tabs)/log-mood') as any)}
              />
            </View>
          </View>
        </SafeAreaView>
      </DarkBackground>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const myScore: number | null = data?.me?.today_score ?? null;
  const partnerScore: number | null = data?.partner?.today_score ?? null;
  const riskPct = data ? Math.round((data.risk_score || 0) * 100) : 0;
  
  const riskStatus = useMemo(() => {
    if (riskPct < 40) return { color: colors.accentSage, bg: colors.bgSuccess, border: colors.borderSuccess };
    if (riskPct < 70) return { color: colors.accentGold, bg: colors.bgWarning, border: colors.borderWarning };
    return { color: colors.accent, bg: colors.bgDanger, border: colors.borderDanger };
  }, [riskPct, colors]);

  const activeFeatures = useMemo(() => {
    if (!data?.features_snapshot) return [];
    return Object.entries(data.features_snapshot as Record<string, number>)
      .filter(([key, value]) => {
        if (key === 'volatility_score' && value === 0.0) return false;
        if (key === 'streak_broken' && value === 0) return false;
        if (key === 'low_score_overlap' && value === 0) return false;
        if (key === 'sentiment_trend' && value >= 0) return false; 
        if (key === 'mood_delta_7d' && Math.abs(value) < 1.0) return false;
        if (key === 'response_lag_hours' && value < 2.0) return false;
        if (key === 'calendar_stress' && value < 0.3) return false;
        return true;
      })
      .slice(0, 3)
      .map(([key, value]) => formatFeatureName(key, value));
  }, [data?.features_snapshot]);

  const myLogs = data?.me?.last_7_days || [];
  const avgMood = myLogs.length > 0 ? (myLogs.reduce((acc: number, l: any) => acc + l.score, 0) / myLogs.length).toFixed(1) : '--';
  const daysLogged = myLogs.length > 0 ? myLogs.length : '--';
  const syncScore = data?.correlation_score !== undefined ? data.correlation_score.toFixed(2) : '--';

  return (
    <DarkBackground>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {/* Header Area */}
          <View style={ds.header}>
            <View>
              <Text style={ds.greeting}>{getGreetingCopy(user?.display_name || '')}</Text>
            </View>
            <View style={[ds.riskBadge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', shadowColor: riskStatus.color, shadowRadius: 15, shadowOpacity: 0.2 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {riskPct > 70 ? (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="heart" size={14} color={riskStatus.color} />
                  </Animated.View>
                ) : (
                  <Ionicons name="heart-half" size={14} color={riskStatus.color} />
                )}
                <Text style={[ds.riskPct, { color: riskStatus.color }]}>{riskPct}%</Text>
              </View>
              <Text style={[ds.riskLabel, { color: colors.textPrimary, opacity: 0.6 }]}>stress risk</Text>
            </View>
          </View>
          
          <View style={ds.headerRule} />

          {/* Active Signals Strip */}
          {activeFeatures.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={ds.signalsScroll}>
              {activeFeatures.map((feature, i) => (
                <View key={i} style={ds.signalPill}>
                  <Text style={ds.signalDot}>●</Text>
                  <Text style={ds.signalText}>{feature}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Mood Graph Card */}
          <View style={ds.graphCard}>
            <View style={ds.cardHeaderRow}>
              <Text style={ds.cardTitle}>Mood Trends</Text>
              <View style={ds.rangeSelector}>
                {['7d', '30d', '90d'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setTimeRange(r as any)}
                    style={[ds.rangePill, timeRange === r && ds.rangePillActive]}
                  >
                    <Text style={[ds.rangeText, timeRange === r && ds.rangeTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {data && (() => {
              const myLogsData = data.me?.last_7_days || [];
              const partnerLogsData = data.partner?.last_7_days || [];
              const totalLogs = Math.max(myLogsData.length, partnerLogsData.length);
              
              return (
                <View style={{ marginHorizontal: -8, position: 'relative' }}>
                  <LinearGradient
                    colors={['transparent', 'rgba(247, 166, 196, 0.12)']}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
                    pointerEvents="none"
                  />
                  <MoodLineChart 
                    partnerAData={myLogsData}
                    partnerBData={partnerLogsData}
                  />
                  {totalLogs < 2 && (
                    <Text style={{ fontSize: 11, color: colors.textMuted, textAlign:'center', marginTop: 8, marginBottom: 8 }}>
                      Log for 2+ days to see your trend line
                    </Text>
                  )}
                </View>
              );
            })()}

            <View style={ds.legendRow}>
              <View style={ds.legendItem}>
                <View style={[ds.legendColor, { backgroundColor: colors.chartUser }]} />
                <Text style={ds.legendText}>You</Text>
              </View>
              <View style={ds.legendItem}>
                <View style={[ds.legendColor, { backgroundColor: colors.chartPartner }]} />
                <Text style={ds.legendText}>Partner</Text>
              </View>
            </View>
          </View>

          {/* Today's Status Card */}
          <View style={ds.statusCard}>
            <Text style={ds.sectionLabel}>TODAY'S FEELING</Text>
            <View style={ds.statusRow}>
              {/* Me */}
              <View style={ds.statusCol}>
                <Text style={ds.statusWho}>You</Text>
                <Text style={[ds.statusScore, { color: getEmotionColor(myScore, data?.me?.today_tags || [], colors) }]}>{myScore ?? '—'}</Text>
                <Text style={ds.emojiText}>{getMoodEmoji(myScore)}</Text>
                <View style={ds.tagsRow}>
                  {data?.me?.today_tags?.slice(0, 2).map((tag: string, i: number) => (
                    <View key={i} style={ds.tagPill}>
                      <Text style={ds.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={ds.verticalHeartDivider}>
                <Ionicons name="heart" size={16} color="rgba(255,255,255,0.15)" />
              </View>

              {/* Partner */}
              <View style={ds.statusCol}>
                <Text style={ds.statusWho}>Partner</Text>
                {partnerScore ? (
                  <>
                    <Text style={[ds.statusScore, { color: getEmotionColor(partnerScore, data?.partner?.today_tags || [], colors) }]}>{partnerScore}</Text>
                    <Text style={ds.emojiText}>{getMoodEmoji(partnerScore)}</Text>
                    <View style={ds.tagsRow}>
                      {data?.partner?.today_tags?.slice(0, 2).map((tag: string, i: number) => (
                        <View key={i} style={ds.tagPill}>
                          <Text style={ds.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[ds.statusScore, { color: colors.textPlaceholder }]}>—</Text>
                    <Text style={[ds.emojiText, { fontSize: 14, color: colors.textMuted, marginTop: 0 }]}>not logged yet</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* STREAK CARD */}
          <View style={ds.streakCard}>
            {(data?.me?.streak > 0 && data?.partner?.streak > 0) ? (
              <View style={ds.streakRow}>
                <View style={ds.streakCol}>
                  <Text style={[ds.streakText, { color: '#FFD166', textShadowColor: 'rgba(255, 209, 102, 0.4)', textShadowRadius: 10 }]}>🔥 {data.me.streak} day streak</Text>
                  <Text style={ds.streakWho}>You</Text>
                </View>
                <View style={ds.verticalHeartDivider}>
                  <Ionicons name="heart" size={16} color="rgba(255,255,255,0.15)" />
                </View>
                <View style={ds.streakCol}>
                  <Text style={[ds.streakText, { color: '#FFD166', textShadowColor: 'rgba(255, 209, 102, 0.4)', textShadowRadius: 10 }]}>🔥 {data.partner.streak} day streak</Text>
                  <Text style={ds.streakWho}>Partner</Text>
                </View>
              </View>
            ) : (
              <Text style={ds.streakMotivational}>Start logging daily to build your streak</Text>
            )}
          </View>

          {/* CORRELATION HINT */}
          <View style={ds.statsRow}>
            <View style={ds.statMiniCard}>
              <Text style={ds.statLabel}>Sync Score</Text>
              <Text style={ds.statValue}>{syncScore}</Text>
            </View>
            <View style={ds.statMiniCard}>
              <Text style={ds.statLabel}>Avg Mood</Text>
              <Text style={ds.statValue}>{avgMood}</Text>
            </View>
            <View style={ds.statMiniCard}>
              <Text style={ds.statLabel}>Days Logged</Text>
              <Text style={ds.statValue}>{daysLogged}</Text>
            </View>
          </View>

          {/* Suggestion Card (if high stress) */}
          {data?.suggestion && riskPct > 70 && (
            <View style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={['#B8A1E3', '#F7A6C4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 1 }}
              >
                <View style={[ds.suggestionCard, { margin: 0, marginBottom: 0, borderWidth: 0 }]}>
                  <View style={ds.suggestionHeader}>
                    <Ionicons name="mail-open" size={16} color={colors.accent} />
                    <Text style={[ds.suggestionTitle, { color: colors.textPrimary }]}>A NOTE FOR YOU TWO</Text>
                  </View>
                  <Text style={ds.suggestionBody}>{data.suggestion.title}</Text>
                  <Text style={ds.suggestionDesc}>{data.suggestion.description}</Text>
                  {!suggestionCompleted && !data.suggestion.acted_on && (
                    <TouchableOpacity style={ds.suggestionBtn} onPress={handleSuggestionComplete}>
                      <LinearGradient
                        colors={['#B8A1E3', '#F7A6C4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                      >
                        <Text style={[ds.suggestionBtnText, { color: '#1A1B2F' }]}>We did this</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Log CTA */}
          <View style={{ marginTop: 24, marginBottom: 24 }}>
            <MagnetParticleButton
              title={data?.me?.today_logged ? 'Log another mood' : "Log today's mood"}
              onPress={() => router.push('/(tabs)/log-mood')}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </DarkBackground>
  );
}

const getStyles = (colors: any, isDark: boolean) => {
  const cardStyle: any = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  };

  return StyleSheet.create({
  header: {
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: Theme.fonts.headingBold,
  },
  userName: {
    display: 'none',
  },
  headerRule: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginTop: 16,
    marginHorizontal: -16,
    marginBottom: 16,
  },
  riskBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskPct: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyBold,
  },
  riskLabel: {
    fontSize: 9,
    fontFamily: Theme.fonts.body,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  riskPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signalsScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  signalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTagSelected,
    borderColor: colors.borderAccent,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  signalDot: {
    fontSize: 10,
    color: colors.accent,
  },
  signalText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    fontFamily: Theme.fonts.body,
  },
  // All cards common
  graphCard: {
    ...cardStyle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: Theme.fonts.headingBold,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.borderDefault,
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  rangePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  rangePillActive: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  rangeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: Theme.fonts.body,
  },
  rangeTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontFamily: Theme.fonts.bodyBold,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
  },
  statusCard: {
    ...cardStyle,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusCol: {
    alignItems: 'center',
    flex: 1,
  },
  statusWho: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statusScore: {
    fontSize: 52,
    fontWeight: '800',
    fontFamily: Theme.fonts.headingBold,
    marginBottom: 8,
  },
  emojiText: {
    fontSize: 24,
    marginTop: -4,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tagPill: {
    backgroundColor: colors.bgTagSelected,
    borderColor: colors.borderAccent,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: Theme.fonts.body,
  },
  verticalHeartDivider: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  streakCard: {
    ...cardStyle,
    justifyContent: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakCol: {
    alignItems: 'center',
    flex: 1,
  },
  streakText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: Theme.fonts.bodyBold,
  },
  streakWho: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
    marginTop: 4,
  },
  verticalDividerStreak: {
    display: 'none',
  },
  streakMotivational: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statMiniCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: Theme.fonts.body,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Theme.fonts.headingBold,
  },
  suggestionCard: {
    ...cardStyle,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.accent,
    fontFamily: Theme.fonts.bodyBold,
  },
  suggestionBody: {
    fontSize: 18,
    color: colors.textPrimary,
    fontFamily: Theme.fonts.headingBold,
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
    lineHeight: 20,
    marginBottom: 16,
  },
  suggestionBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.bgTagSelected,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  suggestionBtnText: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: Theme.fonts.bodyBold,
  },
});
}