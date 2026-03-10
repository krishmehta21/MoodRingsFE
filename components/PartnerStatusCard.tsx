import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

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
  const { colors } = useTheme();

  const renderStatus = (status: PartnerStatus, isLeft: boolean) => (
    <View style={[styles.statusColumn, isLeft ? { borderRightWidth: 1, borderRightColor: colors.borderDefault } : null]}>
      <Text style={[styles.partnerName, { color: status.color }]}>{status.name}</Text>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { color: colors.textPrimary }]}>{status.score ?? '-'}</Text>
        <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Mood</Text>
      </View>
      <View style={styles.tagList}>
        {status.tags.slice(0, 3).map(tag => (
          <View key={tag} style={[styles.miniTag, { backgroundColor: colors.bgTag }]}>
            <Text style={[styles.miniTagText, { color: colors.textSecondary }]}>{tag}</Text>
          </View>
        ))}
        {status.tags.length === 0 && (
          <Text style={[styles.noTags, { color: colors.textSecondary }]}>No tags today</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
      {renderStatus(userStatus, true)}
      {renderStatus(partnerStatus, false)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  },
  scoreLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  miniTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
  },
  noTags: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});
