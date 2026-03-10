import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface RiskBadgeProps {
  percentage: number; // 0 to 100
  label?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  percentage,
  label = "Couple Stress",
}) => {
  const { colors } = useTheme();

  const getColors = () => {
    if (percentage < 40) return { border: colors.borderSuccess, text: colors.accentSage, bg: colors.bgSuccess };
    if (percentage < 70) return { border: colors.borderWarning, text: colors.accentGold, bg: colors.bgWarning };
    return { border: colors.borderDanger, text: colors.accent, bg: colors.bgDanger };
  };

  const statusColors = getColors();

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { borderColor: statusColors.border, backgroundColor: statusColors.bg }]}>
        <Text style={[styles.percentage, { color: statusColors.text }]}>{percentage}%</Text>
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
  },
  badge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  percentage: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 24,
  },
  label: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    marginTop: Theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
