import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

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
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.pill,
        selected && styles.selectedPill,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Theme.colors.tagBackground,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.pill,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedPill: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.accent,
  },
  label: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  selectedLabel: {
    color: Theme.colors.accent,
    fontFamily: Theme.fonts.bodyMedium,
  },
});
