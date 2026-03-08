import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { EmotionTagPill } from './EmotionTagPill';

interface PartnerStatus {
  name: string;
  score: number | null;
  tags: string[];
  color: string;
}

interface PartnerStatusCardProps {
  userStatus: PartnerStatus;
  partnerStatus: PartnerStatus;
}

export const PartnerStatusCard: React.FC<PartnerStatusCardProps> = ({
  userStatus,
  partnerStatus,
}) => {
  const renderStatus = (status: PartnerStatus, isLeft: boolean) => (
    <View style={[styles.statusColumn, isLeft ? styles.borderRight : null]}>
      <Text style={[styles.partnerName, { color: status.color }]}>{status.name}</Text>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{status.score ?? '-'}</Text>
        <Text style={styles.scoreLabel}>Mood</Text>
      </View>
      <View style={styles.tagList}>
        {status.tags.slice(0, 3).map(tag => (
          <View key={tag} style={styles.miniTag}>
            <Text style={styles.miniTagText}>{tag}</Text>
          </View>
        ))}
        {status.tags.length === 0 && (
          <Text style={styles.noTags}>No tags today</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderStatus(userStatus, true)}
      {renderStatus(partnerStatus, false)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.soft,
    marginVertical: Theme.spacing.md,
  },
  statusColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: Theme.colors.border,
  },
  partnerName: {
    fontFamily: Theme.fonts.heading,
    fontSize: 16,
    marginBottom: Theme.spacing.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  scoreText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
    color: Theme.colors.textPrimary,
  },
  scoreLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  miniTag: {
    backgroundColor: Theme.colors.tagBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fonts.body,
  },
  noTags: {
    fontSize: 10,
    fontStyle: 'italic',
    color: Theme.colors.textSecondary,
  },
});
