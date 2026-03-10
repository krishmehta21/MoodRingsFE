import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface EmotionTagPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const EmotionTagPill: React.FC<EmotionTagPillProps> = ({
  label,
  selected,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.pill,
        { backgroundColor: colors.bgTag, borderColor: 'transparent' },
        selected && { backgroundColor: colors.bgTagSelected, borderColor: colors.borderAccent },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary },
          selected && { color: colors.accent, fontFamily: Theme.fonts.bodyMedium },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.pill,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
  },
  label: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
  },
});
