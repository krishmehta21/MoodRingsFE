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
  TextInput,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkBackground } from '../../components/DarkBackground';
import { MoodSlider } from '../../components/MoodSlider';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width: W } = Dimensions.get('window');

const EMOTIONS = [
  { id: 'calm', label: 'Calm', emoji: '🍃' },
  { id: 'anxious', label: 'Anxious', emoji: '🦋' },
  { id: 'happy', label: 'Happy', emoji: '☀️' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'loved', label: 'Loved', emoji: '💛' },
  { id: 'frustrated', label: 'Frustrated', emoji: '🔥' },
  { id: 'sad', label: 'Sad', emoji: '🌧' },
  { id: 'excited', label: 'Excited', emoji: '⚡' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' }
];

const PROMPTS = [
  "What made you smile today?",
  "What's been weighing on you?",
  "Describe your day in 3 words.",
  "What do you wish had gone differently?",
  "What are you grateful for right now?",
  "What's something nobody asked you about today?",
  "If today were a weather pattern, what would it be?",
  "What do you need tonight?",
];

const getMoodLabel = (score: number) => {
  if (score === 1) return { label: 'Really struggling', emoji: '😔' };
  if (score === 2) return { label: 'Pretty rough', emoji: '😔' };
  if (score === 3) return { label: 'Not great', emoji: '😕' };
  if (score === 4) return { label: 'A bit low', emoji: '😕' };
  if (score === 5) return { label: 'Getting by', emoji: '😐' };
  if (score === 6) return { label: 'Doing okay', emoji: '🙂' };
  if (score === 7) return { label: 'Feeling good', emoji: '🙂' };
  if (score === 8) return { label: 'Really good', emoji: '😊' };
  if (score === 9) return { label: 'Great day', emoji: '🌟' };
  return { label: 'On top of the world', emoji: '✨' };
};

const SCORE_COLORS = [
  '#9FA8DA', '#A4B1DB', '#A9BADB', '#AEC4DD', '#B3CDDD', 
  '#B8A1E3', '#CFA3D4', '#E6A4C5', '#FCA5B6', '#FFD166'
];
const getScoreColor = (score: number) => {
  return SCORE_COLORS[score - 1] || SCORE_COLORS[4];
};

const getEmotionColor = (label: string): string => {
  const t = label.toLowerCase();
  if (t === 'happy' || t === 'excited') return '#FFD166';
  if (t === 'calm') return '#A8DADC';
  if (t === 'loved') return '#FFAFCC';
  if (t === 'sad' || t === 'tired') return '#9FA8DA';
  if (t === 'frustrated' || t === 'overwhelmed') return '#F28482';
  if (t === 'grateful') return '#B5EAD7';
  if (t === 'anxious') return '#FFDAC1';
  return '#B8A1E3';
};

const getHeaderCopy = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { title: 'Good morning 🌤', sub: 'How did you wake up?' };
  if (hour < 17) return { title: 'Hey there 🌿', sub: 'Taking a moment for yourself.' };
  if (hour < 21) return { title: 'Winding down? 🌙', sub: "How's your heart today?" };
  return { title: 'End of the day ✨', sub: 'Just you and your thoughts.' };
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function LogMoodScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const ls = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [score, setScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [isJournalFocused, setIsJournalFocused] = useState(false);

  // Animations
  const promptOpacity = React.useRef(new Animated.Value(1)).current;
  const labelOpacity = React.useRef(new Animated.Value(1)).current;
  const scoreScale = React.useRef(new Animated.Value(1)).current;

  // Track previous score to trigger unmount/remount
  const [prevScore, setPrevScore] = useState(5);

  const fetchRecentLogs = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${API_URL}/logs/me?user_id=${user.id}`);
      const logs = await resp.json();
      const unique = logs.filter((log: any, idx: number, arr: any[]) =>
        arr.findIndex((l: any) => l.logged_at === log.logged_at) === idx
      );
      setRecentLogs(unique.slice(0, 5));
    } catch {}
  };

  useFocusEffect(useCallback(() => {
    fetchRecentLogs();
  }, [user]));

  const handleScoreChange = (val: number) => {
    if (val !== score) {
      setScore(val);
      // Animate the label
      labelOpacity.setValue(0);
      Animated.timing(labelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      
      // Animate the score number bounce
      scoreScale.setValue(1.15);
      Animated.spring(scoreScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const shufflePrompt = () => {
    Animated.timing(promptOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setPromptIdx((promptIdx + 1) % PROMPTS.length);
      Animated.timing(promptOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
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
  const headerCopy = getHeaderCopy();
  const scoreColor = getScoreColor(score);
  const hasLoggedToday = recentLogs.length > 0 && new Date(recentLogs[0].logged_at).toDateString() === new Date().toDateString();

  const buttonGradient = ['#B8A1E3', '#F7A6C4'];
  const getSubmitLabel = () => {
    return "Save Today's Feeling";
  };

  return (
    <DarkBackground>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Soft warm radial glow at top-center */}
      <View style={{
        position: 'absolute', top: -60, alignSelf: 'center',
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: colors.bgInputFocus
      }} pointerEvents="none" />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={ls.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {hasLoggedToday && (
              <View style={ls.contextPill}>
                <Text style={ls.contextPillText}>
                  You logged a {recentLogs[0].score} earlier today · tap to update
                </Text>
              </View>
            )}

            <View style={ls.header}>
              <Text style={ls.title}>{headerCopy.title}</Text>
              <Text style={ls.subtitle}>{headerCopy.sub}</Text>
            </View>

            {/* Mood Slider Card */}
            <View style={ls.sliderCard}>
              <Animated.View style={[ls.sliderLeftBorder, { backgroundColor: scoreColor }]} />
              
              <View style={ls.moodInfo}>
                <View style={{ flex: 1 }}>
                  <View style={ls.emojiRow}>
                    <Animated.Text key={score} style={[ls.moodLabel, { opacity: labelOpacity }]}>
                      {moodMeta.label}
                    </Animated.Text>
                  </View>
                </View>
                <Animated.Text style={[ls.moodScore, { color: scoreColor, transform: [{ scale: scoreScale }] }]}>
                  {score}
                </Animated.Text>
              </View>
              
              <MoodSlider 
                value={score} 
                onValueChange={handleScoreChange}
                minimumTrackTintColor={scoreColor}
                maximumTrackTintColor={'rgba(255,255,255,0.1)'}
                thumbTintColor={'#F7A6C4'}
                hideLabels={true}
              />
              
              <View style={ls.sliderLabels}>
                <Text style={ls.valLabel}>LOW</Text>
                <Text style={ls.valLabel}>HIGH</Text>
              </View>
            </View>

            {/* Emotion Tags */}
            <View style={ls.section}>
              <Text style={ls.sectionHeader}>What's in the air right now?</Text>
              <View style={ls.tagContainer}>
                {EMOTIONS.map(tag => {
                  const isSelected = selectedTags.includes(tag.label);
                  const tagColor = getEmotionColor(tag.label);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(tag.label)}
                      style={[
                        ls.tagPill, 
                        isSelected 
                          ? [ls.tagPillSelected, { borderColor: tagColor, shadowColor: tagColor }] 
                          : ls.tagPillUnselected
                      ]}
                    >
                      <Text style={[
                        ls.tagText, 
                        isSelected ? [ls.tagTextSelected, { color: tagColor }] : ls.tagTextUnselected
                      ]}>{tag.emoji} {tag.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Journal Section */}
            <View style={ls.section}>
              <View style={[
                ls.journalContainer,
                isJournalFocused && ls.journalFocusBorder
              ]}>
                <View style={ls.journalHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
                    <Text style={ls.privacyNote}>Just for you</Text>
                  </View>
                </View>

                <TouchableOpacity activeOpacity={0.7} onPress={shufflePrompt} style={{ marginBottom: 12 }}>
                  <Animated.Text style={[ls.promptText, { opacity: promptOpacity }]}>
                    ✦ {PROMPTS[promptIdx]}
                  </Animated.Text>
                </TouchableOpacity>

                <TextInput
                  style={ls.journalInput}
                  value={journal}
                  onChangeText={setJournal}
                  placeholder="How are you feeling today?"
                  placeholderTextColor={'rgba(230,233,240,0.3)'}
                  multiline
                  onFocus={() => setIsJournalFocused(true)}
                  onBlur={() => setIsJournalFocused(false)}
                  selectionColor={colors.accent}
                />
                
                <Text style={[ls.charLimit, journal.length > 400 && { color: colors.accent }]}>
                  {journal.length} / 500
                </Text>
              </View>
            </View>

            {error && (
              <View style={ls.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.accent} />
                <Text style={[ls.errorText, { color: colors.accent }]}>{error}</Text>
              </View>
            )}

            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
              {hasLoggedToday && !loading && (
                <Text style={ls.alreadyLoggedText}>✓ You've already logged today — tap to update</Text>
              )}
              
              <TouchableOpacity 
                style={ls.submitTouchLayout}
                onPress={handleSave}
                disabled={loading}
              >
                <LinearGradient
                  colors={buttonGradient as any}
                  style={ls.submitGradient}
                >
                  <Text style={ls.submitText}>{loading ? "Saving..." : getSubmitLabel()}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Recent entries */}
            {recentLogs.length > 0 && (
              <View style={ls.recentSection}>
                <Text style={[ls.recentHeader, { color: colors.textMuted }]}>RECENT ENTRIES</Text>
                {recentLogs.map((log) => (
                  <View key={log.id} style={ls.recentItem}>
                    <View style={ls.recentLeft}>
                      <Text style={ls.recentScore}>{log.score}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={ls.recentTime}>{formatTime(log.logged_at)}</Text>
                        <Text style={ls.recentTags} numberOfLines={1}>
                          {log.emotion_tags?.join(' · ') || 'No tags'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DarkBackground>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  scrollContent: {
    paddingBottom: 140,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contextPill: {
    marginBottom: 12,
    marginHorizontal: 4,
    backgroundColor: colors.bgTagSelected,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignSelf: 'flex-start',
  },
  contextPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.body,
  },
  header: {
    paddingHorizontal: 4,
    paddingTop: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Theme.fonts.headingBold,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: Theme.fonts.body,
  },
  // Slider Card
  sliderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginVertical: 16,
    marginHorizontal: 4,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sliderLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    borderRadius: 2,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 4, // Make room for border
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodLabel: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  moodScore: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: Theme.fonts.headingBold,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  valLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: Theme.fonts.body,
    color: colors.textPlaceholder,
  },
  // Sections
  section: {
    marginTop: 8,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    letterSpacing: 0.8,
    fontStyle: 'italic',
    fontFamily: Theme.fonts.body,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagPill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginRight: 8,
    marginBottom: 8,
  },
  tagPillUnselected: {
    backgroundColor: colors.bgTag,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
  },
  tagPillSelected: {
    backgroundColor: colors.bgTagSelected,
    borderColor: colors.accent,
    borderWidth: 1.5,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  tagText: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
  },
  tagTextUnselected: {
    color: colors.textPrimary,
  },
  tagTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Journal
  journalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  journalFocusBorder: {
    borderColor: colors.borderAccent,
  },
  privacyNote: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: Theme.fonts.body,
  },
  promptText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: Theme.fonts.body,
    color: colors.textMuted,
  },
  journalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // push lock right
    alignItems: 'center',
    marginBottom: 8,
  },
  journalInput: {
    backgroundColor: 'transparent',
    color: '#E6E9F0',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 26,
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 0,
    marginTop: 8,
  },
  charLimit: {
    fontSize: 11,
    color: colors.textPlaceholder,
    textAlign: 'right',
    marginTop: 6,
    fontFamily: Theme.fonts.body,
  },
  // Submit
  alreadyLoggedText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Theme.fonts.body,
  },
  submitTouchLayout: {
    width: '100%',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  submitGradient: {
    height: 58,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitText: {
    color: '#1A1B2F',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Theme.fonts.headingBold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
  },
  // Recent
  recentSection: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  recentHeader: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: Theme.fonts.body,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  recentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentScore: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: Theme.fonts.headingBold,
    width: 30,
    textAlign: 'center',
  },
  recentTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Theme.fonts.bodyBold,
  },
  recentTags: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});