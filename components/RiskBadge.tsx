import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface RiskBadgeProps {
  percentage: number; // 0 to 100
  label?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  percentage,
  label = "Couple Stress",
}) => {
  const getColor = () => {
    if (percentage < 40) return Theme.colors.success;
    if (percentage < 70) return Theme.colors.warning;
    return Theme.colors.alert;
  };

  const color = getColor();

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { borderColor: color }]}>
        <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.soft,
  },
  percentage: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 20,
  },
  label: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
