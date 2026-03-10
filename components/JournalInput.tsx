import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface JournalInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const MAX_CHARS = 500;

const PROMPTS = [
  "What made you smile today?",
  "What's been on your mind lately?",
  "How did you and your partner connect today?",
  "What's one thing you're grateful for right now?",
  "What's been draining your energy?",
  "What do you wish your partner knew today?",
  "Describe today in three words...",
  "What are you looking forward to?",
  "What felt hard today?",
  "What would make tomorrow better?",
];

export const JournalInput: React.FC<JournalInputProps> = ({
  value,
  onChangeText,
  placeholder,
}) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const charsLeft = MAX_CHARS - value.length;
  const isNearLimit = charsLeft <= 80;
  const isAtLimit = charsLeft <= 20;

  const cyclePrompt = () => {
    setPromptIndex(i => (i + 1) % PROMPTS.length);
  };

  const usePrompt = () => {
    if (!value) {
      onChangeText(PROMPTS[promptIndex] + ' ');
    }
  };

  const currentPrompt = PROMPTS[promptIndex];

  return (
    <View style={styles.wrapper}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
          <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>Private journal</Text>
        </View>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Your partner never sees this</Text>
      </View>

      {/* Prompt chip */}
      <View style={styles.promptRow}>
        <TouchableOpacity 
          style={[styles.promptChip, { backgroundColor: `${colors.accent}14`, borderColor: `${colors.accent}30` }]} 
          onPress={usePrompt} 
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles" size={12} color={colors.accent} />
          <Text style={[styles.promptText, { color: colors.accent }]} numberOfLines={1}>{currentPrompt}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.shuffleButton, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }]} 
          onPress={cyclePrompt} 
          activeOpacity={0.7}
        >
          <Ionicons name="shuffle" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Input area */}
      <View style={[
        styles.inputCard, 
        { backgroundColor: colors.bgInput, borderColor: colors.borderDefault },
        focused && { borderColor: `${colors.accent}80`, backgroundColor: colors.bgCard }
      ]}>
        {/* Decorative left border accent */}
        <View style={[styles.accentBar, { backgroundColor: `${colors.accent}40` }]} />

        <TextInput
          multiline
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder={placeholder || "What's on your mind..."}
          placeholderTextColor={colors.textPlaceholder}
          value={value}
          onChangeText={t => onChangeText(t.slice(0, MAX_CHARS))}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* Footer inside card */}
        <View style={[styles.inputFooter, { borderTopColor: colors.borderSubtle }]}>
          {value.length > 0 ? (
            <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
              <Text style={[styles.clearText, { color: colors.textSecondary }]}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <Text style={[
            styles.charCount,
            { color: colors.textSecondary },
            isNearLimit && { color: colors.accentGold },
            isAtLimit && { color: colors.accent },
          ]}>
            {isAtLimit ? `${charsLeft} left` : `${value.length}/${MAX_CHARS}`}
          </Text>
        </View>
      </View>

      {/* Privacy note */}
      {focused && (
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={12} color={colors.accentSage} />
          <Text style={[styles.privacyText, { color: colors.accentSage }]}>
            Encrypted and stored privately. Your partner only sees your mood score.
          </Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    fontStyle: 'italic',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  promptChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  promptText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 12,
  },
  shuffleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: 140,
    ...Theme.shadows.soft,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  input: {
    padding: 14,
    paddingLeft: 18,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 110,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
  },
  charCount: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  privacyText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    lineHeight: 16,
  },
});