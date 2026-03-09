import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

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
  const getTierStyles = () => {
    switch (tier) {
      case 'priority':
        return {
          backgroundColor: '#FFF5F2',
          borderColor: 'rgba(196, 118, 74, 0.2)',
          icon: 'alert-circle-outline',
          iconColor: Theme.colors.alert,
        };
      case 'active':
        return {
          backgroundColor: '#FFFBF2',
          borderColor: 'rgba(232, 184, 109, 0.2)',
          icon: 'bulb-outline',
          iconColor: Theme.colors.warning,
        };
      case 'soft':
      default:
        return {
          backgroundColor: '#F9FBF9',
          borderColor: 'rgba(127, 175, 138, 0.2)',
          icon: 'heart-outline',
          iconColor: Theme.colors.success,
        };
    }
  };

  const stylesT = getTierStyles();

  return (
    <View style={[styles.container, { backgroundColor: stylesT.backgroundColor, borderColor: stylesT.borderColor }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={completed ? "checkmark-circle" : stylesT.icon as any} size={24} color={completed ? Theme.colors.success : stylesT.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{completed ? completedMessage : description}</Text>
        
        {!completed && actions.length > 0 && (
          <View style={styles.actionsList}>
            {actions.map((action, index) => (
              <View key={index} style={styles.actionItem}>
                <Ionicons name="ellipse" size={6} color={stylesT.iconColor} style={styles.actionBullet} />
                <Text style={styles.actionItemText}>{action}</Text>
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
    backgroundColor: '#FFF9F5', // Slightly warmer tinted white
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(196, 118, 74, 0.1)',
    marginVertical: Theme.spacing.md,
    ...Theme.shadows.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
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
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
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
    color: Theme.colors.accent,
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
    color: Theme.colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
});
