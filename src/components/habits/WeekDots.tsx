import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {colors, spacing} from '../../theme';
import {Text} from '../Text';
import {addDays, isToday} from '../../lib/dates';
import {
  HabitLog,
  WeekDotStatus,
  consecutiveStreak,
  createdDateKey,
  habitLogId,
  weekDotStatus,
} from '../../lib/habits';

type Props = {
  habitId: string;
  createdAt: unknown;
  endKey: string;
  logsById: Map<string, HabitLog>;
};

export function WeekDots({habitId, createdAt, endKey, logsById}: Props) {
  const createdKey = createdDateKey(createdAt) ?? endKey;

  const days = useMemo(() => {
    const keys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      keys.push(addDays(endKey, -i));
    }
    return keys;
  }, [endKey]);

  const statuses = useMemo(
    () =>
      days.map(key =>
        weekDotStatus(key, createdKey, logsById.get(habitLogId(key, habitId))),
      ),
    [days, createdKey, logsById, habitId],
  );

  const completedCount = statuses.filter(s => s === 'complete').length;
  const streak = consecutiveStreak(
    endKey,
    habitId,
    logsById,
    createdKey,
  );

  const caption =
    streak > 0
      ? `${completedCount} of 7 · ${streak} day streak`
      : `${completedCount} of 7`;

  return (
    <View style={styles.row}>
      <View style={styles.dots}>
        {statuses.map((status, i) => (
          <Dot key={days[i]} status={status} dateKey={days[i]} />
        ))}
      </View>
      <Text variant="caption" color="warmGray" style={styles.caption}>
        {caption}
      </Text>
    </View>
  );
}

function Dot({
  status,
  dateKey,
}: {
  status: WeekDotStatus | null;
  dateKey: string;
}) {
  if (status === null) {
    return <View style={styles.slot} />;
  }

  const today = isToday(dateKey);
  const fill =
    status === 'complete'
      ? colors.moss
      : status === 'partial'
        ? colors.blush
        : 'transparent';
  const border =
    status === 'missed' ? colors.hairline : fill === 'transparent' ? colors.hairline : fill;

  return (
    <View
      style={[
        styles.dotWrap,
        today && styles.todayRing,
      ]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: fill,
            borderColor: border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  slot: {
    width: 6,
    height: 6,
  },
  dotWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  todayRing: {
    borderWidth: 1,
    borderColor: colors.plum,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  caption: {
    fontVariant: ['tabular-nums'],
  },
});
