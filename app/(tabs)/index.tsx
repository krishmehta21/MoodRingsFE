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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoodLineChart } from '../../components/MoodLineChart';
import { SkeletonCard } from '../../components/SkeletonCard';
import { SuggestionCard } from '../../components/SuggestionCard';
import { WarmButton } from '../../components/WarmButton';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getTodayLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestionCompleted, setSuggestionCompleted] = useState(false);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
      });
      
      if (resp.ok) {
        setSuggestionCompleted(true);
      }
    } catch (e) {
      console.error("Failed to mark suggestion as completed", e);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <SkeletonCard height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
          <SkeletonCard height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
          <SkeletonCard height={300} style={{ marginBottom: 12, borderRadius: 20 }} />
          <SkeletonCard height={80} style={{ borderRadius: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="wifi-outline" size={48} color={Theme.colors.textSecondary} />
          <Text style={styles.errorTitle}>Can't reach the server</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <WarmButton title="Try again" variant="outline" onPress={fetchData} style={{ marginTop: 24, width: 160 }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  const hasLogs = data?.me?.last_7_days?.length > 0 || data?.partner?.last_7_days?.length > 0;
  if (!hasLogs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconRing}>
            <Ionicons name="heart-outline" size={40} color={Theme.colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Start your journey.</Text>
          <Text style={styles.emptySubtitle}>
            Log your first mood to see your relationship health here.
          </Text>
          <WarmButton
            title="Log My Mood"
            onPress={() => router.push('/(tabs)/log-mood')}
            style={{ width: 200, marginTop: 32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const myScore: number | null = data.me?.today_score ?? null;
  const partnerScore: number | null = data.partner?.today_score ?? null;
  const riskPct = Math.round((data.risk_score || 0) * 100);
  // Using the color array generated by the API directly, or fallback to default
  const riskColor = data.risk_color || '#7AAB8A'; 
  const riskLabel = data.risk_label || 'Feeling connected';
  const riskIcon = getRiskIcon(riskPct);

  // Pass raw ISO timestamps directly — MoodLineChart handles formatting
  const formatChartData = (logs: any[]) => {
    if (!logs) return [];
    return logs.map(l => ({ date: l.date, score: l.score }));
  };

  // Convert features object into ranked array
  const activeFeatures = useMemo(() => {
    if (!data?.features_snapshot) return [];
    return Object.entries(data.features_snapshot as Record<string, number>)
      .filter(([key, value]) => {
        // Skip volatility if exactly 0.0 per requirements
        if (key === 'volatility_score' && value === 0.0) return false;
        // Skip things that don't indicate stress depending on their thresholds
        if (key === 'streak_broken' && value === 0) return false;
        if (key === 'low_score_overlap' && value === 0) return false;
        if (key === 'sentiment_trend' && value >= 0) return false; 
        if (key === 'mood_delta_7d' && Math.abs(value) < 1.0) return false;
        if (key === 'response_lag_hours' && value < 2.0) return false;
        if (key === 'calendar_stress' && value < 0.3) return false;
        return true;
      })
      // Could sort by impact if we knew weights, otherwise just take top 3 active
      .slice(0, 3)
      .map(([key, value]) => formatFeatureName(key, value));
  }, [data?.features_snapshot]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.accent} />
        }
      >
        {/* ── Greeting header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.dateLabel}>{getTodayLabel()}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() ?? '?'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Relationship health banner ── */}
        <View style={styles.healthBannerOuter}>
          <View style={[styles.healthBanner, { borderColor: riskColor + '55', backgroundColor: riskColor + '12' }]}>
            <View style={styles.healthBannerLeft}>
              <Ionicons name={riskIcon} size={20} color={riskColor} />
              <View style={styles.healthBannerText}>
                <Text style={[styles.healthBannerTitle, { color: riskColor }]}>{riskLabel}</Text>
                <Text style={styles.healthBannerSub}>Relationship stress indicator</Text>
              </View>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskBadgeText}>{riskPct}%</Text>
            </View>
          </View>
          
          {/* Feature Breakdown if we have stress triggers */}
          {activeFeatures.length > 0 && riskPct > 30 && (
            <View style={styles.featuresList}>
              <Text style={styles.featuresTitle}>Key stress factors:</Text>
              {activeFeatures.map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name="medical" size={8} color={riskColor + '88'} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Today's mood cards ── */}
        <Text style={styles.sectionLabel}>TODAY'S MOOD</Text>
        <View style={styles.scoreRow}>
          {/* You */}
          <View style={[styles.scoreCard, { borderTopColor: '#6B9FD4' }]}>
            <Text style={styles.scoreCardWho}>You</Text>
            {myScore !== null ? (
              <>
                <Text style={[styles.scoreCardEmoji]}>{getMoodEmoji(myScore)}</Text>
                <Text style={[styles.scoreCardValue, { color: '#6B9FD4' }]}>{myScore}</Text>
                <Text style={styles.scoreCardSub}>out of 10</Text>
              </>
            ) : (
              <>
                <Text style={styles.scoreCardEmoji}>💭</Text>
                <Text style={styles.scoreCardMissing}>Not logged</Text>
                <TouchableOpacity
                  style={styles.logNowButton}
                  onPress={() => router.push('/(tabs)/log-mood')}
                >
                  <Text style={styles.logNowText}>Log now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Ionicons name="heart" size={18} color={Theme.colors.accent} style={styles.heartDivider} />

          {/* Partner */}
          <View style={[styles.scoreCard, { borderTopColor: '#E8A0B4' }]}>
            <Text style={styles.scoreCardWho}>Partner</Text>
            {partnerScore !== null ? (
              <>
                <Text style={styles.scoreCardEmoji}>{getMoodEmoji(partnerScore)}</Text>
                <Text style={[styles.scoreCardValue, { color: '#E8A0B4' }]}>{partnerScore}</Text>
                <Text style={styles.scoreCardSub}>out of 10</Text>
              </>
            ) : (
              <>
                <Text style={styles.scoreCardEmoji}>💭</Text>
                <Text style={styles.scoreCardMissing}>Not logged yet</Text>
              </>
            )}
          </View>
        </View>

        {/* ── Mood chart ── */}
        <MoodLineChart
          partnerAData={formatChartData(data.me?.last_7_days)}
          partnerBData={formatChartData(data.partner?.last_7_days)}
        />

        {/* ── Streaks ── */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>LOGGING STREAKS</Text>
        <View style={styles.streakRow}>
          <View style={styles.streakItem}>
            <Ionicons name="flame" size={22} color="#6B9FD4" />
            <Text style={[styles.streakNum, { color: '#6B9FD4' }]}>{data.me?.streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Your streak</Text>
            <Text style={styles.streakDays}>days</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Ionicons name="flame" size={22} color="#E8A0B4" />
            <Text style={[styles.streakNum, { color: '#E8A0B4' }]}>{data.partner?.streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Their streak</Text>
            <Text style={styles.streakDays}>days</Text>
          </View>
        </View>

        {/* ── Suggestion ── */}
        {data.suggestion && (
          <View style={styles.suggestionOuter}>
            <View style={styles.suggestionTag}>
              <Ionicons name="sparkles" size={11} color={Theme.colors.accent} />
              <Text style={styles.suggestionTagText}>SUGGESTED FOR YOU BOTH</Text>
            </View>
            <SuggestionCard
              title={data.suggestion.title || 'Connection Moment'}
              description={
                data.suggestion.description ||
                'Take a minute to share one thing you appreciate about each other today.'
              }
              tier={data.suggestion.tier || 'soft'}
              actions={data.suggestion.actions || []}
              onPress={handleSuggestionComplete}
              completed={suggestionCompleted || data.suggestion.acted_on}
            />
          </View>
        )}

        {/* ── Log CTA ── */}
        <TouchableOpacity
          style={styles.logCTA}
          onPress={() => router.push('/(tabs)/log-mood')}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.logCTAText}>
            {data.me?.today_logged ? 'Log another mood' : "Log today's mood"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 56,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  dateLabel: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 20,
    color: Theme.colors.textPrimary,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 15,
    color: '#fff',
  },

  // Health banner
  healthBannerOuter: {
    marginBottom: 20,
  },
  healthBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  healthBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  healthBannerText: {
    flex: 1,
  },
  healthBannerTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 15,
  },
  healthBannerSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  riskBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  riskBadgeText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 14,
    color: '#fff',
  },
  featuresList: {
    backgroundColor: Theme.colors.surface,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    marginTop: -4, // tuck under banner
    marginHorizontal: 4,
    ...Theme.shadows.soft,
    zIndex: -1,
  },
  featuresTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  featureText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },

  // Section labels
  sectionLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  // Score cards
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
    ...Theme.shadows.soft,
    minHeight: 120,
    justifyContent: 'center',
  },
  scoreCardWho: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreCardEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  scoreCardValue: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 38,
    lineHeight: 42,
  },
  scoreCardSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  scoreCardMissing: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  logNowButton: {
    marginTop: 8,
    backgroundColor: Theme.colors.accent + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logNowText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: Theme.colors.accent,
  },
  heartDivider: {
    marginHorizontal: 10,
  },

  // Streaks
  streakRow: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Theme.shadows.soft,
  },
  streakItem: {
    alignItems: 'center',
    gap: 2,
  },
  streakNum: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
    lineHeight: 36,
  },
  streakLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.textPrimary,
  },
  streakDays: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  streakDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#EDE8E4',
  },

  // Suggestion
  suggestionOuter: {
    marginBottom: 16,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    marginLeft: 2,
  },
  suggestionTagText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    color: Theme.colors.accent,
    letterSpacing: 1.5,
  },

  // Log CTA
  logCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.accent,
    borderRadius: 16,
    padding: 16,
  },
  logCTAText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 15,
    color: '#fff',
  },

  // Empty / Error
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF0E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 26,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  errorTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 20,
    color: Theme.colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});