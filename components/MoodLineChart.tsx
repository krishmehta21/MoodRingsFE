import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Theme } from '../constants/theme';

interface DataPoint {
  date: string;
  score: number;
}

interface MoodLineChartProps {
  partnerAData: DataPoint[];
  partnerBData: DataPoint[];
}

const { width } = Dimensions.get('window');
const PARTNER_A_COLOR = '#6B9FD4';
const PARTNER_B_COLOR = '#E8A0B4';

const getMoodEmoji = (score: number) => {
  if (score <= 2) return '😔';
  if (score <= 4) return '😕';
  if (score <= 6) return '😐';
  if (score <= 8) return '🙂';
  return '😊';
};

export const MoodLineChart: React.FC<MoodLineChartProps> = ({
  partnerAData,
  partnerBData,
}) => {
  const allDates = Array.from(new Set([
    ...partnerAData.map(d => d.date),
    ...partnerBData.map(d => d.date),
  ])).sort();

  if (allDates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No mood data yet for this period.</Text>
      </View>
    );
  }

  const aMap = Object.fromEntries(partnerAData.map(d => [d.date, d.score]));
  const bMap = Object.fromEntries(partnerBData.map(d => [d.date, d.score]));

  const aRaw: (number | null)[] = allDates.map(d => aMap[d] ?? null);
  const bRaw: (number | null)[] = allDates.map(d => bMap[d] ?? null);

  const forwardFill = (arr: (number | null)[]): { values: number[]; real: boolean[] } => {
    let last = 5;
    const values: number[] = [];
    const real: boolean[] = [];
    arr.forEach(v => {
      if (v !== null) { last = v; values.push(v); real.push(true); }
      else { values.push(last); real.push(false); }
    });
    return { values, real };
  };

  const clamp = (arr: number[]) => arr.map(v => Math.min(10, Math.max(1, v)));

  const { values: aFilled, real: aReal } = forwardFill(aRaw);
  const { values: bFilled, real: bReal } = forwardFill(bRaw);
  const aData = clamp(aFilled);
  const bData = clamp(bFilled);

  const maxLabels = 6;
  const step = Math.max(1, Math.ceil(allDates.length / maxLabels));
  const labels = allDates.map((d, i) => {
    if (i % step !== 0 && i !== allDates.length - 1) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    if (d.includes('T')) return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  });

  const lastRealA = partnerAData.length > 0
    ? [...partnerAData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).pop()!.score
    : aData[aData.length - 1];
  const lastRealB = partnerBData.length > 0
    ? [...partnerBData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).pop()!.score
    : bData[bData.length - 1];

  const avgA = partnerAData.length > 0
    ? Math.round(partnerAData.reduce((s, d) => s + d.score, 0) / partnerAData.length) : 0;
  const avgB = partnerBData.length > 0
    ? Math.round(partnerBData.reduce((s, d) => s + d.score, 0) / partnerBData.length) : 0;

  const moodDiff = lastRealA - lastRealB;
  const alignmentPct = Math.round((1 - Math.abs(moodDiff) / 9) * 100);
  const getAlignmentColor = () => {
    if (alignmentPct >= 75) return '#7AAB8A';
    if (alignmentPct >= 50) return '#C4A35A';
    return '#C4764A';
  };
  const alignmentColor = getAlignmentColor();

  const getDiffInfo = () => {
    if (moodDiff === 0) return { text: 'Perfect mood match ✨', color: '#7AAB8A' };
    if (Math.abs(moodDiff) <= 2) return { text: `Mood gap: ${Math.abs(moodDiff)} — pretty close`, color: '#7AAB8A' };
    if (moodDiff > 0) return { text: `Mood gap: ${moodDiff} — you're doing better`, color: PARTNER_A_COLOR };
    return { text: `Mood gap: ${Math.abs(moodDiff)} — partner is doing better`, color: PARTNER_B_COLOR };
  };
  const diffInfo = getDiffInfo();

  // Pad to lock Y axis 1–10. Padding points are never real.
  const paddedLabels = ['', ...labels, ''];
  const paddedA = [1, ...aData, 10];
  const paddedB = [1, ...bData, 10];
  const paddedARealFlags = [false, ...aReal, false];
  const paddedBRealFlags = [false, ...bReal, false];

  // Last real index in the padded arrays — used to place the highlight ring
  const lastRealIndexA = paddedARealFlags.lastIndexOf(true);
  const lastRealIndexB = paddedBRealFlags.lastIndexOf(true);

  // getDotColor is called dataset-by-dataset, index-by-index — same ordering
  // as renderDotContent so we can use a shared counter for both.
  let getDotColorCount = 0;
  let renderDotCount = 0;
  const datasetLength = paddedLabels.length;

  const chartData = {
    labels: paddedLabels,
    datasets: [
      { data: paddedA, color: (opacity = 1): string => `rgba(107,159,212,${opacity * 0.9})`, strokeWidth: 2.5 },
      { data: paddedB, color: (opacity = 1): string => `rgba(232,160,180,${opacity * 0.9})`, strokeWidth: 2.5 },
    ],
  };

  const chartWidth = width - 48;
  const posA = (lastRealA - 1) / 9;
  const posB = (lastRealB - 1) / 9;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Mood Over Time</Text>
      <Text style={styles.subtitle}>1 = rough day · 10 = wonderful</Text>

      {/* ── Legend ── */}
      <View style={styles.legendBox}>
        <View style={styles.legendRow}>
          <View style={styles.legendHalfLeft}>
            <View style={[styles.legendDash, { backgroundColor: PARTNER_A_COLOR }]} />
            <Text style={styles.legendWho}>You</Text>
            <Text style={[styles.legendLatest, { color: PARTNER_A_COLOR }]}>
              {partnerAData.length > 0 ? `${getMoodEmoji(lastRealA)} ${lastRealA}` : '—'}
            </Text>
            {partnerAData.length > 0 && (
              <View style={styles.avgChip}><Text style={styles.avgText}>avg {avgA}</Text></View>
            )}
          </View>

          <View style={styles.legendSep} />

          <View style={styles.legendHalfRight}>
            {partnerBData.length > 0 && (
              <View style={styles.avgChip}><Text style={styles.avgText}>avg {avgB}</Text></View>
            )}
            <Text style={[styles.legendLatest, { color: PARTNER_B_COLOR }]}>
              {partnerBData.length > 0 ? `${getMoodEmoji(lastRealB)} ${lastRealB}` : '—'}
            </Text>
            <Text style={styles.legendWhoRight}>Partner</Text>
            <View style={[styles.legendDash, { backgroundColor: PARTNER_B_COLOR }]} />
          </View>
        </View>

        {/* ── Emotional Alignment Bar ── */}
        {partnerAData.length > 0 && partnerBData.length > 0 && (
          <View style={styles.alignmentSection}>
            <View style={styles.alignmentHeaderRow}>
              <Text style={styles.alignmentLabel}>Emotional Alignment</Text>
              <Text style={[styles.alignmentPct, { color: alignmentColor }]}>{alignmentPct}%</Text>
            </View>
            <View style={styles.alignmentTrack}>
              <View style={[styles.alignmentFill, {
                left: `${Math.min(posA, posB) * 100}%`,
                width: `${Math.abs(posA - posB) * 100}%`,
                backgroundColor: alignmentColor + '40',
                borderColor: alignmentColor + '60',
              }]} />
              <View style={[styles.alignmentDot, {
                left: `${posA * 100}%`,
                backgroundColor: PARTNER_A_COLOR,
                transform: [{ translateX: -14 }],
              }]}>
                <Text style={styles.alignmentDotEmoji}>{getMoodEmoji(lastRealA)}</Text>
              </View>
              <View style={[styles.alignmentDot, {
                left: `${posB * 100}%`,
                backgroundColor: PARTNER_B_COLOR,
                transform: [{ translateX: -14 }],
              }]}>
                <Text style={styles.alignmentDotEmoji}>{getMoodEmoji(lastRealB)}</Text>
              </View>
            </View>
            <View style={styles.alignmentAxisRow}>
              <Text style={styles.alignmentAxisLabel}>1</Text>
              <Text style={styles.alignmentAxisLabel}>5</Text>
              <Text style={styles.alignmentAxisLabel}>10</Text>
            </View>
          </View>
        )}

        <View style={styles.trendRow}>
          <Text style={styles.trendText}>
            {partnerAData.length === 0 ? "You haven't logged yet"
              : partnerBData.length === 0 ? "Your partner hasn't logged yet"
              : Math.abs(moodDiff) <= 1 ? 'You two are in sync right now 💫'
              : moodDiff > 0 ? "You're feeling better than your partner right now"
              : "Your partner is feeling better than you right now"}
          </Text>
        </View>
      </View>

      {/* ── Line Chart ── */}
      <View style={styles.chartWrapper}>
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>10</Text>
          <Text style={styles.yLabel}>7</Text>
          <Text style={styles.yLabel}>4</Text>
          <Text style={styles.yLabel}>1</Text>
        </View>

        <LineChart
          data={chartData}
          width={chartWidth - 28}
          height={170}
          fromZero={false}
          withHorizontalLabels={false}
          withShadow={false}
          chartConfig={{
            backgroundColor: Theme.colors.surface,
            backgroundGradientFrom: Theme.colors.surface,
            backgroundGradientTo: Theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(180,160,140,${opacity * 0.4})`,
            labelColor: (): string => Theme.colors.textSecondary,
            style: { borderRadius: 12 },
            propsForDots: {
              // Keep r at visible size — getDotColor controls visibility per-point
              r: '4',
              strokeWidth: '0',
            },
            propsForBackgroundLines: {
              stroke: '#EDE8E4',
              strokeDasharray: '4',
              strokeWidth: '1',
              strokeOpacity: '0.4',
            },
            propsForLabels: { fontSize: '9' },
          }}
          getDotColor={(_dataPoint: number, _datasetIndex: number): string => {
            const dsIndex = Math.floor(getDotColorCount / datasetLength);
            const ptIndex = getDotColorCount % datasetLength;
            getDotColorCount++;

            const realFlags = dsIndex === 0 ? paddedARealFlags : paddedBRealFlags;
            const color = dsIndex === 0 ? PARTNER_A_COLOR : PARTNER_B_COLOR;
            const lastRealIdx = dsIndex === 0 ? lastRealIndexA : lastRealIndexB;

            if (!(realFlags[ptIndex] ?? false)) return 'transparent';
            if (ptIndex === lastRealIdx) return 'transparent'; // ring drawn in renderDotContent
            
            return color;
          }}
          renderDotContent={({ x, y }) => {
            const dsIndex = Math.floor(renderDotCount / datasetLength);
            const ptIndex = renderDotCount % datasetLength;
            renderDotCount++;

            const realFlags = dsIndex === 0 ? paddedARealFlags : paddedBRealFlags;
            const color = dsIndex === 0 ? PARTNER_A_COLOR : PARTNER_B_COLOR;
            const lastRealIdx = dsIndex === 0 ? lastRealIndexA : lastRealIndexB;

            if (!(realFlags[ptIndex] ?? false)) return null;
            if (ptIndex !== lastRealIdx) return null;

            return (
              <View
                key={`ring-${dsIndex}-${ptIndex}`}
                style={{
                  position: 'absolute',
                  top: y - 8,
                  left: x - 8,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  borderWidth: 2.5,
                  borderColor: color,
                }}
              />
            );
          }}
          bezier={false}
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          segments={9}
        />
      </View>

      {/* ── Mood Gap Pill ── */}
      {partnerAData.length > 0 && partnerBData.length > 0 && (
        <View style={[styles.diffRow, {
          borderColor: diffInfo.color + '50',
          backgroundColor: diffInfo.color + '12',
        }]}>
          <Text style={[styles.diffText, { color: diffInfo.color }]}>{diffInfo.text}</Text>
        </View>
      )}

      <Text style={styles.xHint}>← past · recent →</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: 16,
    ...Theme.shadows.soft,
  },
  emptyContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  title: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 15,
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginBottom: 12,
  },
  legendBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E4',
    marginBottom: 12,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 10,
  },
  legendHalfLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendHalfRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  legendDash: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  legendWho: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  legendWhoRight: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  legendLatest: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 17,
  },
  avgChip: {
    backgroundColor: '#EDE8E4',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  avgText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.textSecondary,
  },
  legendSep: {
    width: 1,
    height: 28,
    backgroundColor: '#EDE8E4',
    marginHorizontal: 10,
  },
  alignmentSection: {
    borderTopWidth: 1,
    borderTopColor: '#EDE8E4',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  alignmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alignmentLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  alignmentPct: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 13,
  },
  alignmentTrack: {
    height: 28,
    backgroundColor: '#EDE8E4',
    borderRadius: 14,
    marginHorizontal: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  alignmentFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1,
  },
  alignmentDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  alignmentDotEmoji: {
    fontSize: 14,
  },
  alignmentAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  alignmentAxisLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 9,
    color: Theme.colors.textSecondary,
    opacity: 0.6,
  },
  trendRow: {
    borderTopWidth: 1,
    borderTopColor: '#EDE8E4',
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8F4',
  },
  trendText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxis: {
    width: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
    paddingVertical: 8,
  },
  yLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 9,
    color: Theme.colors.textSecondary,
    opacity: 0.7,
  },
  chart: {
    borderRadius: 12,
    flex: 1,
  },
  diffRow: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  diffText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
  },
  xHint: {
    fontFamily: Theme.fonts.body,
    fontSize: 9,
    color: Theme.colors.textSecondary,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 6,
  },
});