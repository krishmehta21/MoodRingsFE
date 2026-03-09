import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmotionTagPill } from '../../components/EmotionTagPill';
import { JournalInput } from '../../components/JournalInput';
import { MoodSlider } from '../../components/MoodSlider';
import { WarmButton } from '../../components/WarmButton';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const EMOTIONS = [
  'Calm', 'Anxious', 'Happy', 'Tired', 'Loved',
  'Frustrated', 'Sad', 'Excited', 'Grateful', 'Overwhelmed'
];

const getMoodLabel = (score: number) => {
  if (score <= 2) return { label: 'Really rough', emoji: '😔' };
  if (score <= 4) return { label: 'Not great', emoji: '😕' };
  if (score <= 6) return { label: 'Getting by', emoji: '😐' };
  if (score <= 8) return { label: 'Pretty good', emoji: '🙂' };
  return { label: 'Wonderful', emoji: '😊' };
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function LogMoodScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [score, setScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchRecentLogs = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${API_URL}/logs/me?user_id=${user.id}`);
      const logs = await resp.json();
      setRecentLogs(logs.slice(0, 5)); // Show last 5
    } catch {}
  };

  useFocusEffect(useCallback(() => {
    fetchRecentLogs();
  }, [user]));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const resetForm = () => {
    setScore(5);
    setSelectedTags([]);
    setJournal('');
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const payload = {
      user_id: user.id,
      score,
      emotion_tags: selectedTags,
      journal_text: journal,
    };

    try {
      const response = await fetch(`${API_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Something went wrong.");

      resetForm();
      await fetchRecentLogs();

      Alert.alert(
        "Logged ✓",
        "Your mood has been saved.",
        [{ text: "Go to Dashboard", onPress: () => router.replace('/(tabs)') },
         { text: "Log Another", style: "cancel" }]
      );
    } catch (e: any) {
      setError(e.message || "Couldn't save just yet. Try again?");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert(
      "Delete Entry",
      "Remove this mood log?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API_URL}/logs/${logId}?user_id=${user?.id}`, {
                method: 'DELETE'
              });
              fetchRecentLogs();
            } catch {
              Alert.alert("Error", "Couldn't delete. Try again.");
            }
          }
        }
      ]
    );
  };

  const moodMeta = getMoodLabel(score);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>How are you feeling?</Text>
          <Text style={styles.subtitle}>Log as many times as you want.</Text>

          {/* Mood score */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreLabelRow}>
              <Text style={styles.scoreEmoji}>{moodMeta.emoji}</Text>
              <Text style={styles.scoreLabel}>{moodMeta.label}</Text>
              <Text style={styles.scoreBig}>{score}</Text>
            </View>
            <MoodSlider value={score} onValueChange={setScore} />
          </View>

          {/* Emotion tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How would you describe it?</Text>
            <View style={styles.tagContainer}>
              {EMOTIONS.map(tag => (
                <EmotionTagPill
                  key={tag}
                  label={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>
          </View>

          {/* Journal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anything on your mind?</Text>
            <Text style={styles.sectionSubtitle}>Private — only you can see this.</Text>
            <JournalInput value={journal} onChangeText={setJournal} />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Theme.colors.accent} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <WarmButton
            title={loading ? "Saving..." : "Save Entry"}
            onPress={handleSave}
            loading={loading}
            style={styles.submitButton}
          />

          {/* Recent logs */}
          {recentLogs.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentHeader}>Recent Entries</Text>
              {recentLogs.map((log) => (
                <View key={log.id} style={styles.recentLog}>
                  <View style={styles.recentLeft}>
                    <Text style={styles.recentScore}>{log.score}</Text>
                    <View style={styles.recentMeta}>
                      <Text style={styles.recentTime}>{formatTime(log.logged_at)}</Text>
                      {log.emotion_tags?.length > 0 && (
                        <Text style={styles.recentTags}>
                          {log.emotion_tags.slice(0, 3).join(' · ')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteLog(log.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={Theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 30,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  scoreSection: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.soft,
  },
  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  scoreEmoji: { fontSize: 24 },
  scoreLabel: {
    flex: 1,
    fontFamily: Theme.fonts.heading,
    fontSize: 18,
    color: Theme.colors.textPrimary,
  },
  scoreBig: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 36,
    color: Theme.colors.accent,
  },
  section: { marginBottom: Theme.spacing.xl },
  sectionTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  submitButton: { marginTop: Theme.spacing.sm },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    flex: 1,
    color: Theme.colors.accent,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
  },

  // Recent logs
  recentSection: {
    marginTop: Theme.spacing.xl,
  },
  recentHeader: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.md,
  },
  recentLog: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: 8,
    ...Theme.shadows.soft,
  },
  recentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentScore: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 28,
    color: Theme.colors.accent,
    width: 36,
    textAlign: 'center',
  },
  recentMeta: { flex: 1 },
  recentTime: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textPrimary,
  },
  recentTags: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
});