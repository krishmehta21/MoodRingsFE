import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SuggestionCardProps {
  title: string;
  description: string;
  tier?: 'soft' | 'active' | 'priority';
  actions?: string[];
  onPress?: () => void;
  completed?: boolean;
  completedMessage?: string;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  title,
  description,
  tier = 'soft',
  actions = [],
  onPress,
  completed = false,
  completedMessage = 'Beautiful. You showed up for each other.',
}) => {
  const { colors } = useTheme();

  const getTierStyles = () => {
    switch (tier) {
      case 'priority':
        return {
          backgroundColor: `${colors.accent}15`,
          borderColor: colors.borderAccentSoft,
          icon: 'alert-circle-outline',
          iconColor: colors.textAccent,
        };
      case 'active':
        return {
          backgroundColor: `${colors.accentGold}15`,
          borderColor: colors.borderSubtle,
          icon: 'bulb-outline',
          iconColor: colors.accentGold,
        };
      case 'soft':
      default:
        return {
          backgroundColor: `${colors.accentSage}15`,
          borderColor: colors.borderSubtle,
          icon: 'heart-outline',
          iconColor: colors.accentSage,
        };
    }
  };

  const stylesT = getTierStyles();

  return (
    <View style={[styles.container, { backgroundColor: stylesT.backgroundColor, borderColor: stylesT.borderColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.bgCard }]}>
        <Ionicons name={completed ? "checkmark-circle" : stylesT.icon as any} size={24} color={completed ? colors.accentSage : stylesT.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{completed ? completedMessage : description}</Text>
        
        {!completed && actions.length > 0 && (
          <View style={styles.actionsList}>
            {actions.map((action, index) => (
              <View key={index} style={styles.actionItem}>
                <Ionicons name="ellipse" size={6} color={stylesT.iconColor} style={styles.actionBullet} />
                <Text style={[styles.actionItemText, { color: colors.textPrimary }]}>{action}</Text>
              </View>
            ))}
          </View>
        )}

        {!completed && (
          <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Text style={[styles.actionText, { color: stylesT.iconColor }]}>Mark as done</Text>
            <Ionicons name="checkmark" size={16} color={stylesT.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    marginVertical: Theme.spacing.md,
    ...Theme.shadows.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 18,
    marginBottom: 4,
  },
  description: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    marginRight: 4,
  },
  actionsList: {
    marginBottom: 8,
    gap: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionBullet: {
    marginTop: 6,
    marginRight: 6,
  },
  actionItemText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
