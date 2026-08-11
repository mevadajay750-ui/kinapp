import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {colors, spacing, radius} from '../../theme';
import {Text} from '../Text';
import {getHabitIcon} from '../habits/habitIcons';
import type {Habit, HabitLog} from '../../lib/habits';
import type {HabitProgress} from '../../lib/dayStats';

type Props = {
  habits: Habit[];
  habitLogs: HabitLog[];
  progress: HabitProgress;
  loading?: boolean;
  onToggleBinary: (habit: Habit) => void;
  onOpenHabits: () => void;
};

export function HabitsStrip({
  habits,
  habitLogs,
  progress,
  loading,
  onToggleBinary,
  onOpenHabits,
}: Props) {
  const logByHabit = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of habitLogs) {
      map.set(log.habitId, log);
    }
    return map;
  }, [habitLogs]);

  const sorted = useMemo(() => {
    const incomplete: Habit[] = [];
    const complete: Habit[] = [];
    for (const h of habits) {
      if (logByHabit.get(h.id)?.completed) {
        complete.push(h);
      } else {
        incomplete.push(h);
      }
    }
    return [...incomplete, ...complete].slice(0, 4);
  }, [habits, logByHabit]);

  const allDone = progress.total > 0 && progress.done === progress.total;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="h3" color="plum">
          Habits
        </Text>
        {allDone ? (
          <Text variant="caption" color="moss">
            All done
          </Text>
        ) : (
          <Text variant="caption" color="warmGray" style={styles.count}>
            {progress.done} of {progress.total}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={styles.skelTile} />
          ))}
        </View>
      ) : habits.length === 0 ? (
        <Text variant="caption" color="warmGray">
          No habits yet.
        </Text>
      ) : (
        <View style={styles.grid}>
          {sorted.map(habit => (
            <HabitTile
              key={habit.id}
              habit={habit}
              completed={!!logByHabit.get(habit.id)?.completed}
              onPress={() => {
                if (habit.kind === 'binary') {
                  onToggleBinary(habit);
                } else {
                  onOpenHabits();
                }
              }}
            />
          ))}
        </View>
      )}

      {habits.length > 4 ? (
        <Pressable
          onPress={onOpenHabits}
          hitSlop={8}
          style={styles.seeAll}
          accessibilityRole="link"
          accessibilityLabel={`See all ${habits.length} habits`}>
          <Text variant="caption" color="plum">
            See all {habits.length}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function HabitTile({
  habit,
  completed,
  onPress,
}: {
  habit: Habit;
  completed: boolean;
  onPress: () => void;
}) {
  const Icon = getHabitIcon(habit.icon);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (habit.kind !== 'binary') {
      return;
    }
    if (completed) {
      scale.setValue(0.8);
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(1);
    }
  }, [completed, habit.kind, scale]);

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.tile, pressed && {opacity: 0.85}]}
      accessibilityRole="button"
      accessibilityLabel={habit.name}
      accessibilityState={{checked: completed}}>
      <Animated.View
        style={[
          styles.iconCircle,
          {
            backgroundColor: completed ? colors.moss : colors.blush,
            transform: [{scale}],
          },
        ]}>
        <Icon
          size={16}
          color={completed ? colors.papaya : colors.warmGray}
          strokeWidth={1.8}
        />
      </Animated.View>
      <Text variant="caption" color="plum" numberOfLines={1} style={styles.name}>
        {habit.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  count: {
    fontVariant: ['tabular-nums'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
  },
  seeAll: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  skelTile: {
    width: '47%',
    flexGrow: 1,
    flexBasis: '45%',
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.hairline,
  },
});
