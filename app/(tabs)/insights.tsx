import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonCard } from '../../components/SkeletonCard';
import { WarmButton } from '../../components/WarmButton';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { DarkBackground } from '../../components/DarkBackground';
import { StatusBar } from 'expo-status-bar';

const API_URL = process.env.EXPO_PUBLIC_API_URL ;

export default function InsightsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  
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
      <DarkBackground>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <SkeletonCard height={150} style={{ marginBottom: 24, backgroundColor: colors.bgCard }} />
          <View style={styles.row}>
            <SkeletonCard width="48%" height={100} style={{ backgroundColor: colors.bgCard }} />
            <View style={{ width: '4%' }} />
            <SkeletonCard width="48%" height={100} style={{ backgroundColor: colors.bgCard }} />
          </View>
          <SkeletonCard height={100} style={{ marginTop: 24, marginBottom: 12, backgroundColor: colors.bgCard }} />
          <SkeletonCard height={100} style={{ backgroundColor: colors.bgCard }} />
        </View>
      </DarkBackground>
    );
  }

  if (error) {
    return (
      <DarkBackground>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.accent }]}>{error}</Text>
          <WarmButton title="Try Again" variant="outline" onPress={fetchData} style={{ marginTop: 24 }} />
        </View>
      </DarkBackground>
    );
  }

  const hasInsights = correlation || patterns.length > 0;

  if (!hasInsights) {
    return (
      <DarkBackground>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.centerContainer}>
          <Ionicons name="sparkles-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Gathering insights...</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Log your moods for a few more days to see patterns and correlations emerge.</Text>
        </View>
      </DarkBackground>
    );
  }

  const hasCorrelationData = correlation && correlation.score !== undefined && correlation.score !== 0;
  const correlationInterpretation = hasCorrelationData 
    ? correlation.interpretation 
    : "Not enough data yet. Keep logging to see how your moods sync up!";

  return (
    <DarkBackground>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          <Text style={[styles.header, { color: colors.textPrimary }]}>Your Story Together</Text>
          
          {/* Correlation Card */}
          <View style={[styles.correlationCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 80 }}>
                <View style={[
                  styles.ring, 
                  hasCorrelationData && correlation.score > 0.5 
                    ? { borderColor: '#B8A1E3', shadowColor: '#B8A1E3', shadowOpacity: 0.4 } 
                    : { borderColor: 'rgba(230,233,240,0.15)' }
                ]} />
                <View style={[
                  styles.ring, 
                  hasCorrelationData && correlation.score > 0.5 
                    ? { borderColor: '#F7A6C4', shadowColor: '#F7A6C4', shadowOpacity: 0.4, marginLeft: -24 } 
                    : { borderColor: 'rgba(230,233,240,0.15)', marginLeft: 8 }
                ]} />
              </View>
              {hasCorrelationData && (
                <>
                  <Text style={{ fontFamily: Theme.fonts.headingBold, fontSize: 32, color: colors.textPrimary, marginTop: 12 }}>
                    {Math.round(correlation.score * 100)}%
                  </Text>
                  <Text style={{ fontFamily: Theme.fonts.body, fontSize: 10, color: colors.textAccentSoft, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
                    Mood Sync
                  </Text>
                </>
              )}
            </View>
            <Text style={[styles.interpretation, { color: colors.textPrimary, textAlign: 'center' }]}>
              {correlationInterpretation}
            </Text>
          </View>

          {/* Streak Cards */}
          <View style={styles.row}>
            <StreakCard 
                title="Your Streak" 
                streak={dashboardData?.me?.streak || 0} 
                color={colors.accent}
                colors={colors}
            />
            <View style={{ width: 16 }} />
            <StreakCard 
                title="Partner's Streak" 
                streak={dashboardData?.partner?.streak || 0} 
                color={colors.accentSage}
                colors={colors}
            />
          </View>

          <Text style={[styles.sectionHeader, { color: colors.textAccentSoft }]}>Patterns Detected</Text>
          {patterns && patterns.length > 0 ? (
            patterns.map((p, idx) => {
              const accentColor = idx % 2 === 0 ? '#B8A1E3' : '#F7A6C4';
              return (
              <View key={idx} style={[styles.patternCard, { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)', borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
                <Text style={[styles.patternText, { color: colors.textPrimary, fontStyle: 'italic' }]}>{p.observation}</Text>
              </View>
            )})
          ) : (
            <View style={[styles.patternCard, { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <Text style={[styles.patternText, { color: colors.textSecondary }]}>Your patterns will appear here as you keep logging together.</Text>
            </View>
          )}

          {/* Best Week Highlight Mockup */}
          <Text style={[styles.sectionHeader, { color: colors.textAccentSoft, marginTop: 16 }]}>A Memory to Keep</Text>
          <View style={[styles.goldenCard, { backgroundColor: 'rgba(255, 209, 102, 0.08)', borderColor: 'rgba(255, 209, 102, 0.2)' }]}>
             <Ionicons name="star" size={16} color="#FFD166" style={{ marginBottom: 12 }} />
             <Text style={{ color: '#FFD166', fontFamily: Theme.fonts.headingBold, fontSize: 16, marginBottom: 4 }}>Your Best Week</Text>
             <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: Theme.fonts.body, fontSize: 14, fontStyle: 'italic', lineHeight: 22 }}>
               You both logged your highest moods recently. You were highly synced, finding calm and joy together.
             </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </DarkBackground>
  );
}


const StreakCard = ({ title, streak, color, colors }: { title: string, streak: number, color: string, colors: any }) => (
  <View style={[styles.streakCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
    <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>{title}</Text>
    <View style={styles.streakValueContainer}>
        <Ionicons name="flame" size={20} color={color} />
        <Text style={[styles.streakValue, { color }]}>{streak}</Text>
    </View>
    <Text style={[styles.streakDays, { color: colors.textMuted }]}>Days</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  header: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 28,
    marginBottom: 24,
  },
  correlationCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  correlationLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 16,
  },
  interpretation: {
    fontFamily: Theme.fonts.heading,
    fontSize: 20,
    lineHeight: 28,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  streakCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  streakLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
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
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  goldenCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  patternCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  patternText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
