import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
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
  const chartW = width - 48; // padding overall
  const chartH = 170;
  const padT = 20;
  const padB = 25;
  const padL = 25;
  const padR = 20;

  const { pathA, pathB, pointsA, pointsB, xAxisTicks, yAxisTicks, lastA, lastB, avgA, avgB } = useMemo(() => {
    const allDatesSet = new Set([
      ...partnerAData.map(d => d.date),
      ...partnerBData.map(d => d.date),
    ]);
    const allDates = Array.from(allDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (allDates.length === 0) {
      return { pathA: '', pathB: '', pointsA: [], pointsB: [], xAxisTicks: [], yAxisTicks: [], lastA: 0, lastB: 0, avgA: 0, avgB: 0 };
    }

    const mapDataA = new Map(partnerAData.map(d => [d.date, d.score]));
    const mapDataB = new Map(partnerBData.map(d => [d.date, d.score]));

    let prevA = 5;
    let prevB = 5;

    const layoutPointsA: any[] = [];
    const layoutPointsB: any[] = [];
    
    const usableW = chartW - padL - padR;
    const usableH = chartH - padT - padB;

    allDates.forEach((date, i) => {
      const realA = mapDataA.has(date);
      const valA = realA ? mapDataA.get(date)! : prevA;
      prevA = valA;
      
      const realB = mapDataB.has(date);
      const valB = realB ? mapDataB.get(date)! : prevB;
      prevB = valB;

      const x = allDates.length === 1 ? padL + usableW / 2 : padL + (i / (allDates.length - 1)) * usableW;
      
      const yA = padT + usableH - ((Math.min(10, Math.max(1, valA)) - 1) / 9) * usableH;
      const yB = padT + usableH - ((Math.min(10, Math.max(1, valB)) - 1) / 9) * usableH;

      layoutPointsA.push({ x, y: yA, real: realA, score: valA, date });
      layoutPointsB.push({ x, y: yB, real: realB, score: valB, date });
    });

    const drawPath = (points: any[]) => {
      if (points.length === 0) return '';
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    };

    // Calculate Y Axis ticks
    const yAxisTicks = [10, 7, 4, 1].map(val => {
      return { val, y: padT + usableH - ((val - 1) / 9) * usableH };
    });

    // Calculate X Axis labels
    const step = Math.max(1, Math.ceil(allDates.length / 5));
    const xAxisTicks = layoutPointsA.map((p, i) => {
      if (i % step !== 0 && i !== layoutPointsA.length - 1 && i !== 0) return null;
      const dateObj = new Date(p.date);
      if (isNaN(dateObj.getTime())) return null;
      const label = p.date.includes('T') 
        ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : dateObj.toLocaleDateString(undefined, { weekday: 'short' });
      return { x: p.x, label };
    }).filter(t => t !== null);

    const actualLastA = partnerAData.length > 0 ? partnerAData[partnerAData.length - 1].score : 0;
    const actualLastB = partnerBData.length > 0 ? partnerBData[partnerBData.length - 1].score : 0;

    const actualAvgA = partnerAData.length > 0 ? Math.round(partnerAData.reduce((s, d) => s + d.score, 0) / partnerAData.length) : 0;
    const actualAvgB = partnerBData.length > 0 ? Math.round(partnerBData.reduce((s, d) => s + d.score, 0) / partnerBData.length) : 0;

    return { 
      pathA: drawPath(layoutPointsA), 
      pathB: drawPath(layoutPointsB), 
      pointsA: layoutPointsA, 
      pointsB: layoutPointsB, 
      xAxisTicks, 
      yAxisTicks,
      lastA: actualLastA,
      lastB: actualLastB,
      avgA: actualAvgA,
      avgB: actualAvgB
    };
  }, [partnerAData, partnerBData, chartW]);

  if (pointsA.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No mood data yet for this period.</Text>
      </View>
    );
  }

  const lastRealIdxA = pointsA.map(p => p.real).lastIndexOf(true);
  const lastRealIdxB = pointsB.map(p => p.real).lastIndexOf(true);

  // Stats Logic
  const moodDiff = lastA - lastB;
  const alignmentPct = partnerAData.length > 0 && partnerBData.length > 0 
    ? Math.round((1 - Math.abs(moodDiff) / 9) * 100)
    : 0;

  let diffText = 'Waiting for data';
  let diffColor = Theme.colors.textSecondary;
  if (partnerAData.length > 0 && partnerBData.length > 0) {
    if (Math.abs(moodDiff) <= 1) { diffText = 'You two are in sync right now 💫'; diffColor = '#7AAB8A'; }
    else if (moodDiff > 0) { diffText = "You're feeling better than your partner"; diffColor = PARTNER_A_COLOR; }
    else { diffText = "Your partner is feeling better than you"; diffColor = PARTNER_B_COLOR; }
  }

  return (
    <View style={styles.wrapper}>
      {/* ── Summary Headers ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Mood Over Time</Text>
        <Text style={styles.subtitle}>1 = low · 10 = high</Text>
      </View>

      <View style={styles.statsCard}>
        {/* You Column */}
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>You</Text>
          <Text style={[styles.statValue, { color: PARTNER_A_COLOR }]}>
            {partnerAData.length > 0 ? `${getMoodEmoji(lastA)} ${lastA}` : '—'}
          </Text>
          {partnerAData.length > 0 && <Text style={styles.statAvg}>Avg {avgA}</Text>}
        </View>

        {/* Sync Metric */}
        {partnerAData.length > 0 && partnerBData.length > 0 && (
          <View style={styles.syncRingObj}>
             <View style={styles.syncRing}>
                <Text style={styles.syncPct}>{alignmentPct}%</Text>
                <Text style={styles.syncLabel}>Sync</Text>
             </View>
          </View>
        )}

        {/* Partner Column */}
        <View style={styles.statColRight}>
          <Text style={styles.statLabel}>Partner</Text>
          <Text style={[styles.statValue, { color: PARTNER_B_COLOR }]}>
            {partnerBData.length > 0 ? `${lastB} ${getMoodEmoji(lastB)}` : '—'}
          </Text>
          {partnerBData.length > 0 && <Text style={styles.statAvg}>Avg {avgB}</Text>}
        </View>
      </View>

      {/* ── SVG Line Chart ── */}
      <View style={styles.chartArea}>
        <Svg width={chartW} height={chartH}>
          {/* Grid Lines */}
          {yAxisTicks.map((tick, i) => (
            <React.Fragment key={`grid-${i}`}>
              <Line 
                x1={padL} x2={chartW - padR} 
                y1={tick.y} y2={tick.y} 
                stroke="#EDE8E4" strokeWidth="1" strokeDasharray="4,4" 
              />
              <SvgText
                x={padL - 6} y={tick.y + 3}
                fill={Theme.colors.textSecondary}
                fontSize="10"
                fontFamily={Theme.fonts.body}
                textAnchor="end"
                opacity={0.6}
              >
                {tick.val}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Paths */}
          {pathB && <Path d={pathB} fill="none" stroke={PARTNER_B_COLOR} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
          {pathA && <Path d={pathA} fill="none" stroke={PARTNER_A_COLOR} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}

          {/* Dots A */}
          {pointsA.map((p, i) => {
            if (!p.real) return null;
            const isLast = i === lastRealIdxA;
            return (
              <React.Fragment key={`dotA-${i}`}>
                <Circle cx={p.x} cy={p.y} r={isLast ? 6 : 4} fill={PARTNER_A_COLOR} />
                {isLast && <Circle cx={p.x} cy={p.y} r={6} fill="none" stroke="#FFFFFF" strokeWidth="2.5" />}
              </React.Fragment>
            );
          })}

          {/* Dots B */}
          {pointsB.map((p, i) => {
            if (!p.real) return null;
            const isLast = i === lastRealIdxB;
            return (
              <React.Fragment key={`dotB-${i}`}>
                <Circle cx={p.x} cy={p.y} r={isLast ? 6 : 4} fill={PARTNER_B_COLOR} />
                {isLast && <Circle cx={p.x} cy={p.y} r={6} fill="none" stroke="#FFFFFF" strokeWidth="2.5" />}
              </React.Fragment>
            );
          })}

          {/* X Axis Labels */}
          {xAxisTicks.map((tick: any, i) => (
            <SvgText
              key={`x-${i}`}
              x={tick.x} y={chartH - 5}
              fill={Theme.colors.textSecondary}
              fontSize="10"
              fontFamily={Theme.fonts.body}
              textAnchor="middle"
              opacity={0.6}
            >
              {tick.label}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* ── Conclusion Pill ── */}
      {partnerAData.length > 0 && partnerBData.length > 0 && (
        <View style={styles.conclusionPill}>
          <Text style={[styles.conclusionText, { color: diffColor }]}>
            {diffText}
          </Text>
        </View>
      )}
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
    ...Theme.shadows.soft,
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  statsCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E4',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'flex-start',
    flex: 1,
  },
  statColRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  statLabel: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  statAvg: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  syncRingObj: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  syncRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#7AAB8A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  syncPct: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 14,
    color: '#333',
    transform: [{ translateY: 2 }],
  },
  syncLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 9,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  chartArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  conclusionPill: {
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#EDE8E4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  conclusionText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
  },
});