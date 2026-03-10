import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface DataPoint {
  date: string;
  score: number;
}

interface ChartConfig {
  userColor?: string;
  partnerColor?: string;
  gridColor?: string;
  labelColor?: string;
  backgroundColor?: string;
}

interface MoodLineChartProps {
  partnerAData: DataPoint[];
  partnerBData: DataPoint[];
  config?: ChartConfig;
}

const { width: W } = Dimensions.get('window');

const getMoodEmoji = (score: number) => {
  if (score === 0) return '—';
  if (score <= 2) return '😔';
  if (score <= 4) return '😕';
  if (score <= 6) return '😐';
  if (score <= 8) return '🙂';
  return '😊';
};

export const MoodLineChart: React.FC<MoodLineChartProps> = ({
  partnerAData,
  partnerBData,
  config = {}
}) => {
  const { colors, isDark } = useTheme();

  const {
    userColor = colors.chartUser,
    partnerColor = colors.chartPartner,
    gridColor = colors.chartGrid,
    labelColor = colors.chartAxis,
    backgroundColor = isDark ? 'transparent' : colors.bgCard
  } = config;

  const chartW = W - 72; // Adjusted for padding inside card
  const chartH = 180;
  const padT = 20;
  const padB = 25;
  const padL = 25;
  const padR = 10;

  const { pathA, pathB, pointsA, pointsB, xAxisTicks, yAxisTicks, lastA, lastB } = useMemo(() => {
    const allDatesSet = new Set([
      ...partnerAData.map(d => d.date),
      ...partnerBData.map(d => d.date),
    ]);
    const allDates = Array.from(allDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    if (allDates.length === 0) {
      return { pathA: '', pathB: '', pointsA: [], pointsB: [], xAxisTicks: [], yAxisTicks: [], lastA: 0, lastB: 0 };
    }

    const mapDataA = new Map(partnerAData.map(d => [d.date, d.score]));
    const mapDataB = new Map(partnerBData.map(d => [d.date, d.score]));

    // Use actual last values or 0
    let lastKnownA = partnerAData.length > 0 ? partnerAData[0].score : 5;
    let lastKnownB = partnerBData.length > 0 ? partnerBData[0].score : 5;

    const layoutPointsA: any[] = [];
    const layoutPointsB: any[] = [];
    
    const usableW = chartW - padL - padR;
    const usableH = chartH - padT - padB;

    allDates.forEach((date, i) => {
      const realA = mapDataA.has(date);
      const valA = realA ? mapDataA.get(date)! : lastKnownA;
      if (realA) lastKnownA = valA;
      
      const realB = mapDataB.has(date);
      const valB = realB ? mapDataB.get(date)! : lastKnownB;
      if (realB) lastKnownB = valB;

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

    const yAxisTicks = [10, 7, 4, 1].map(val => {
      return { val, y: padT + usableH - ((val - 1) / 9) * usableH };
    });

    const step = Math.max(1, Math.ceil(allDates.length / 5));
    const xAxisTicks = layoutPointsA.map((p, i) => {
      if (i % step !== 0 && i !== layoutPointsA.length - 1 && i !== 0) return null;
      const dateObj = new Date(p.date);
      if (isNaN(dateObj.getTime())) return null;
      const label = p.date.includes('T') 
        ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        : dateObj.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
      return { x: p.x, label };
    }).filter(t => t !== null);

    const actualLastA = partnerAData.length > 0 ? partnerAData[partnerAData.length - 1].score : 0;
    const actualLastB = partnerBData.length > 0 ? partnerBData[partnerBData.length - 1].score : 0;

    return { 
      pathA: drawPath(layoutPointsA), 
      pathB: drawPath(layoutPointsB), 
      pointsA: layoutPointsA, 
      pointsB: layoutPointsB, 
      xAxisTicks, 
      yAxisTicks,
      lastA: actualLastA,
      lastB: actualLastB
    };
  }, [partnerAData, partnerBData, chartW]);

  if (pointsA.length < 2 && pointsB.length < 2) {
    return (
      <View style={[styles.emptyContainer, { height: chartH }]}>
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <View style={[styles.emptyRing, { borderColor: '#B8A1E3' }]} />
          <View style={[styles.emptyRing, { borderColor: '#F7A6C4', marginLeft: -12 }]} />
        </View>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Keep logging together to see your mood story here 💜
        </Text>
      </View>
    );
  }

  const lastRealIdxA = pointsA.map(p => p.real).lastIndexOf(true);
  const lastRealIdxB = pointsB.map(p => p.real).lastIndexOf(true);

  return (
    <View style={[styles.container, { backgroundColor, borderRadius: 16, padding: 8 }]}>
      <Svg width={chartW} height={chartH}>
        {/* Grid Lines */}
        {yAxisTicks.map((tick, i) => (
          <React.Fragment key={`grid-${i}`}>
            <Line 
              x1={padL} x2={chartW - padR} 
              y1={tick.y} y2={tick.y} 
              stroke={gridColor} strokeWidth="1" strokeDasharray="4,4" 
              opacity={isDark ? 0.5 : 1}
            />
            <SvgText
              x={padL - 6} y={tick.y + 3}
              fill={labelColor}
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
        {pathB && (
          <Path 
            d={pathB} 
            fill="none" 
            stroke={partnerColor} 
            strokeWidth="3" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            opacity={0.8}
          />
        )}
        {pathA && (
          <Path 
            d={pathA} 
            fill="none" 
            stroke={userColor} 
            strokeWidth="3" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
        )}

        {/* Dots A */}
        {pointsA.map((p, i) => {
          if (!p.real) return null;
          const isLast = i === lastRealIdxA;
          return (
            <React.Fragment key={`dotA-${i}`}>
              <Circle cx={p.x} cy={p.y} r={isLast ? 6 : 4} fill={userColor} />
              {isLast && (
                <Circle cx={p.x} cy={p.y} r={6} fill="none" stroke={isDark ? "#FFFFFF" : colors.bgCard} strokeWidth="2" />
              )}
            </React.Fragment>
          );
        })}

        {/* Dots B */}
        {pointsB.map((p, i) => {
          if (!p.real) return null;
          const isLast = i === lastRealIdxB;
          return (
            <React.Fragment key={`dotB-${i}`}>
              <Circle cx={p.x} cy={p.y} r={isLast ? 6 : 4} fill={partnerColor} />
              {isLast && (
                <Circle cx={p.x} cy={p.y} r={6} fill="none" stroke={isDark ? "#FFFFFF" : colors.bgCard} strokeWidth="2" />
              )}
            </React.Fragment>
          );
        })}

        {/* X Axis Labels */}
        {xAxisTicks.map((tick: any, i) => (
          <SvgText
            key={`x-${i}`}
            x={tick.x} y={chartH - 5}
            fill={labelColor}
            fontSize="9"
            fontFamily={Theme.fonts.body}
            textAnchor="middle"
            opacity={0.6}
          >
            {tick.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  emptyRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  }
});