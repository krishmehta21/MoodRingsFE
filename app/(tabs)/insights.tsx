import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Theme } from '../../constants/theme';
import { SkeletonCard } from '../../components/SkeletonCard';
import { WarmButton } from '../../components/WarmButton';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function InsightsScreen() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correlation, setCorrelation] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null); // For streaks
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      
      const [corrResp, pattResp, dashResp] = await Promise.all([
        fetch(`${API_URL}/insights/correlation?user_id=${user.id}`),
        fetch(`${API_URL}/insights/patterns?user_id=${user.id}`),
        fetch(`${API_URL}/dashboard?user_id=${user.id}`)
      ]);

      if (!corrResp.ok || !pattResp.ok || !dashResp.ok) {
        throw new Error("One or more insights could not be reached.");
      }

      const corrJson = await corrResp.json();
      const pattJson = await pattResp.json();
      const dashJson = await dashResp.json();

      setCorrelation(corrJson);
      setPatterns(pattJson);
      setDashboardData(dashJson);
    } catch (e: any) {
      setError(e.message || "We're having trouble reading the patterns in your moods.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonCard height={150} style={{ marginBottom: 24 }} />
        <View style={styles.row}>
          <SkeletonCard width="48%" height={100} />
          <View style={{ width: '4%' }} />
          <SkeletonCard width="48%" height={100} />
        </View>
        <SkeletonCard height={100} style={{ marginTop: 24, marginBottom: 12 }} />
        <SkeletonCard height={100} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={Theme.colors.textSecondary} />
        <Text style={styles.errorText}>{error}</Text>
        <WarmButton title="Try Again" variant="outline" onPress={fetchData} style={{ marginTop: 24 }} />
      </View>
    );
  }

  const hasInsights = correlation || patterns.length > 0;

  if (!hasInsights) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="sparkles-outline" size={48} color={Theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>Gathering insights...</Text>
        <Text style={styles.emptySubtitle}>Log your moods for a few more days to see patterns and correlations emerge.</Text>
      </View>
    );
  }

  const hasCorrelationData = correlation && correlation.score !== undefined && correlation.score !== 0;
  const correlationInterpretation = hasCorrelationData 
    ? correlation.interpretation 
    : "Not enough data yet. Keep logging to see how your moods sync up!";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.accent} />}
      >
        <Text style={styles.header}>Relationship Insights</Text>
        
        {/* Correlation Card */}
        <View style={styles.correlationCard}>
          <View style={styles.correlationHeader}>
            <Text style={styles.correlationLabel}>Mood Sync</Text>
            {hasCorrelationData && (
              <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{Math.round(correlation.score * 100)}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.interpretation}>
            {correlationInterpretation}
          </Text>
        </View>

        {/* Streak Cards */}
        <View style={styles.row}>
          <StreakCard 
              title="Your Streak" 
              streak={dashboardData?.me?.streak || 0} 
              color={Theme.colors.partnerA} 
          />
          <View style={{ width: Theme.spacing.md }} />
          <StreakCard 
              title="Partner's Streak" 
              streak={dashboardData?.partner?.streak || 0} 
              color={Theme.colors.partnerB} 
          />
        </View>

        <Text style={styles.sectionHeader}>Patterns Detected</Text>
        {patterns && patterns.length > 0 ? (
          patterns.map((p, idx) => (
            <View key={idx} style={styles.patternCard}>
              <Ionicons name="bulb-outline" size={20} color={Theme.colors.accent} style={styles.patternIcon} />
              <Text style={styles.patternText}>{p.observation}</Text>
            </View>
          ))
        ) : (
          <View style={styles.patternCard}>
              <Text style={styles.patternText}>Your patterns will appear here as you keep logging together.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const StreakCard = ({ title, streak, color }: { title: string, streak: number, color: string }) => (
  <View style={styles.streakCard}>
    <Text style={styles.streakLabel}>{title}</Text>
    <View style={styles.streakValueContainer}>
        <Ionicons name="flame" size={20} color={color} />
        <Text style={[styles.streakValue, { color }]}>{streak}</Text>
    </View>
    <Text style={styles.streakDays}>Days</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    padding: Theme.spacing.lg,
    paddingTop: 80,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.background,
  },
  header: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 28,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xl,
  },
  correlationCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.soft,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  correlationLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  scoreBadge: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E4',
  },
  scoreText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 18,
    color: Theme.colors.accent,
  },
  interpretation: {
    fontFamily: Theme.fonts.heading,
    fontSize: 20,
    color: Theme.colors.textPrimary,
    lineHeight: 28,
  },
  row: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.xl,
  },
  streakCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    ...Theme.shadows.soft,
  },
  streakLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  streakValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakValue: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 28,
  },
  streakDays: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.md,
  },
  patternCard: {
    flexDirection: 'row',
    backgroundColor: '#FDFCFB',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#EDE8E4',
    alignItems: 'center',
  },
  patternIcon: {
    marginRight: Theme.spacing.sm,
  },
  patternText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    lineHeight: 20,
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 24,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
