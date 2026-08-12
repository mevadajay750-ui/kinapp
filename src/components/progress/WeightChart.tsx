import React, {useMemo, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View} from 'react-native';
import Svg, {Circle, Line, Path, Text as SvgText} from 'react-native-svg';
import {colors, spacing, typography} from '../../theme';
import {Text} from '../Text';
import {daysBetween} from '../../lib/dates';
import {
  formatDayMonth,
  type TrendPoint,
  type WeightPoint,
} from '../../lib/progressStats';

type Props = {
  points: WeightPoint[];
  trend: TrendPoint[];
  goalKg: number | null;
  height?: number;
};

const PLOT_LEFT = 36;
const PLOT_RIGHT = 44;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 28;
const GAP_DAYS = 10;

export function WeightChart({
  points,
  trend,
  goalKg,
  height = 200,
}: Props) {
  const [width, setWidth] = useState(0);
  const plotW = Math.max(width - PLOT_LEFT - PLOT_RIGHT, 0);
  const plotH = height - PLOT_TOP - PLOT_BOTTOM;

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== width) {
      setWidth(next);
    }
  };

  const empty = points.length < 2;

  const layout = useMemo(() => {
    if (empty || points.length === 0 || width <= 0 || plotW <= 0) {
      return null;
    }
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    const xStart = sorted[0].date;
    const xEnd = sorted[sorted.length - 1].date;
    const xSpan = Math.max(daysBetween(xStart, xEnd), 1);

    // Y from points + trend, padded 8% — never anchor at zero.
    // Goal is included when near the data; far-away goals stay off-chart.
    let yMin = Math.min(...sorted.map(p => p.kg));
    let yMax = Math.max(...sorted.map(p => p.kg));
    if (trend.length > 0) {
      yMin = Math.min(yMin, ...trend.map(t => t.kg));
      yMax = Math.max(yMax, ...trend.map(t => t.kg));
    }
    const dataSpan = Math.max(yMax - yMin, 1);
    if (
      goalKg != null &&
      Number.isFinite(goalKg) &&
      goalKg >= yMin - dataSpan &&
      goalKg <= yMax + dataSpan
    ) {
      yMin = Math.min(yMin, goalKg);
      yMax = Math.max(yMax, goalKg);
    }
    const pad = (yMax - yMin) * 0.08 || 1;
    yMin -= pad;
    yMax += pad;

    const xOf = (date: string) =>
      PLOT_LEFT + (daysBetween(xStart, date) / xSpan) * plotW;
    const yOf = (kg: number) =>
      PLOT_TOP + ((yMax - kg) / (yMax - yMin)) * plotH;

    const goalInDomain =
      goalKg != null &&
      Number.isFinite(goalKg) &&
      goalKg >= yMin &&
      goalKg <= yMax
        ? goalKg
        : null;

    const sortedTrend = [...trend].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const segments: string[] = [];
    let current = '';
    for (let i = 0; i < sortedTrend.length; i++) {
      const t = sortedTrend[i];
      const x = xOf(t.date);
      const y = yOf(t.kg);
      if (i === 0) {
        current = `M ${x} ${y}`;
        continue;
      }
      const prev = sortedTrend[i - 1];
      if (daysBetween(prev.date, t.date) > GAP_DAYS) {
        if (current) {
          segments.push(current);
        }
        current = `M ${x} ${y}`;
      } else {
        current += ` L ${x} ${y}`;
      }
    }
    if (current) {
      segments.push(current);
    }

    const midDate = (() => {
      const midOffset = Math.round(xSpan / 2);
      const [y, m, d] = xStart.split('-').map(Number);
      const date = new Date(y, m - 1, d + midOffset);
      const yy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    })();

    return {
      sorted,
      xStart,
      xEnd,
      midDate,
      yMin,
      yMax,
      xOf,
      yOf,
      goalInDomain,
      segments,
    };
  }, [empty, points, trend, goalKg, plotW, plotH, width]);

  if (empty) {
    return (
      <View style={[styles.frame, {height}]} onLayout={onLayout}>
        <Text variant="caption" color="warmGray" style={styles.empty}>
          Log a few more weights and the shape of it will show up here.
        </Text>
      </View>
    );
  }

  if (!layout || width <= 0) {
    return <View style={{height}} onLayout={onLayout} />;
  }

  const {
    sorted,
    xStart,
    xEnd,
    midDate,
    yMin,
    yMax,
    xOf,
    yOf,
    goalInDomain,
    segments,
  } = layout;

  const captionSize = typography.caption.fontSize ?? 12;
  const captionFont = typography.caption.fontFamily ?? 'Inter-Regular';

  return (
    <View style={{width: '100%', height}} onLayout={onLayout}>
      <Svg width={width} height={height}>
        {goalInDomain != null ? (
          <>
            <Line
              x1={PLOT_LEFT}
              x2={PLOT_LEFT + plotW}
              y1={yOf(goalInDomain)}
              y2={yOf(goalInDomain)}
              stroke={colors.hairline}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText
              x={PLOT_LEFT + plotW + 4}
              y={yOf(goalInDomain) + 3}
              fill={colors.warmGray}
              fontSize={captionSize}
              fontFamily={captionFont}>
              {Math.round(goalInDomain)}
            </SvgText>
          </>
        ) : null}

        {sorted.map(p => (
          <Circle
            key={p.date}
            cx={xOf(p.date)}
            cy={yOf(p.kg)}
            r={2.5}
            fill={colors.warmGray}
            opacity={0.35}
          />
        ))}

        {segments.map((d, i) => (
          <Path
            key={`seg-${i}`}
            d={d}
            stroke={colors.moss}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        <SvgText
          x={PLOT_LEFT}
          y={height - 6}
          fill={colors.warmGray}
          fontSize={captionSize}
          fontFamily={captionFont}>
          {formatDayMonth(xStart)}
        </SvgText>
        <SvgText
          x={PLOT_LEFT + plotW / 2}
          y={height - 6}
          fill={colors.warmGray}
          fontSize={captionSize}
          fontFamily={captionFont}
          textAnchor="middle">
          {formatDayMonth(midDate)}
        </SvgText>
        <SvgText
          x={PLOT_LEFT + plotW}
          y={height - 6}
          fill={colors.warmGray}
          fontSize={captionSize}
          fontFamily={captionFont}
          textAnchor="end">
          {formatDayMonth(xEnd)}
        </SvgText>

        <SvgText
          x={PLOT_LEFT - 6}
          y={PLOT_TOP + 4}
          fill={colors.warmGray}
          fontSize={captionSize}
          fontFamily={captionFont}
          textAnchor="end">
          {Math.round(yMax)}
        </SvgText>
        <SvgText
          x={PLOT_LEFT - 6}
          y={PLOT_TOP + plotH}
          fill={colors.warmGray}
          fontSize={captionSize}
          fontFamily={captionFont}
          textAnchor="end">
          {Math.round(yMin)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  empty: {
    textAlign: 'center',
  },
});
