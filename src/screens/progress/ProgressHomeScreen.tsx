import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {Settings2} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {WeightChart} from '../../components/progress/WeightChart';
import {getHabitIcon} from '../../components/habits/habitIcons';
import {colors, spacing, radius} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {useProfile} from '../../hooks/useProfile';
import {localDateKey} from '../../lib/dates';
import {createdDateKey} from '../../lib/habitLogic';
import {getMealRange} from '../../lib/meals';
import {
  Habit,
  HabitLog,
  getHabitLogRange,
  subscribeToHabits,
} from '../../lib/habits';
import {getWeightRange, WeightEntry} from '../../lib/weights';
import {
  RangeKey,
  formatWeekRange,
  habitConsistency,
  movingAverage,
  netChange,
  rangeStartFor,
  weeklyKcalAverages,
} from '../../lib/progressStats';
import type {ProgressStackParamList} from '../../navigation/ProgressStack';
import type {TabParamList} from '../../navigation/TabNavigator';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ProgressStackParamList, 'ProgressHome'>,
  BottomTabScreenProps<TabParamList>
>;

const RANGES: {key: RangeKey; label: string}[] = [
  {key: '30d', label: '30 days'},
  {key: '90d', label: '90 days'},
  {key: 'all', label: 'All time'},
];

function towardGoal(
  change: number,
  latestKg: number,
  goalKg: number,
): boolean {
  if (change === 0) {
    return true;
  }
  if (goalKg < latestKg) {
    return change < 0;
  }
  if (goalKg > latestKg) {
    return change > 0;
  }
  return true;
}

function goalReached(
  latestKg: number,
  goalKg: number,
  startKg: number | null | undefined,
): boolean {
  const losing =
    startKg != null ? goalKg <= startKg : goalKg <= latestKg;
  return losing ? latestKg <= goalKg : latestKg >= goalKg;
}

export function ProgressHomeScreen({navigation}: Props) {
  const {user} = useAuth();
  const {profile} = useProfile();
  const [range, setRange] = useState<RangeKey>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [mealDaysLogged, setMealDaysLogged] = useState(0);
  const [weekly, setWeekly] = useState<
    ReturnType<typeof weeklyKcalAverages>
  >([]);

  const today = localDateKey();
  const dailyTarget = profile?.dailyKcalTarget ?? 1600;
  const goalKg = profile?.goalWeightKg ?? null;
  const startKg = profile?.startWeightKg ?? null;

  const earliestKey = useMemo(() => {
    const fromProfile = createdDateKey(profile?.createdAt);
    const fromWeight = weights.length
      ? [...weights].sort((a, b) => a.date.localeCompare(b.date))[0].date
      : null;
    const candidates = [fromProfile, fromWeight].filter(Boolean) as string[];
    if (candidates.length === 0) {
      return null;
    }
    return candidates.sort()[0];
  }, [profile?.createdAt, weights]);

  const rangeStart = rangeStartFor(range, today, earliestKey);

  const loadRangeData = useCallback(async () => {
    if (!user) {
      return;
    }
    const uid = user.uid;
    // Wide lower bound for "all" so early weights are included even if
    // profile.createdAt is missing from cache.
    const start =
      range === 'all'
        ? createdDateKey(profile?.createdAt) ?? '2000-01-01'
        : rangeStartFor(range, today);

    try {
      const [weightRows, mealRows, logRows] = await Promise.all([
        getWeightRange(uid, start, today),
        getMealRange(uid, start, today),
        getHabitLogRange(uid, start, today),
      ]);

      let effectiveStart = start;
      if (range === 'all' && weightRows.length > 0) {
        const earliestWeight = weightRows[0].date;
        if (earliestWeight > effectiveStart) {
          effectiveStart = earliestWeight;
        }
      }

      setWeights(weightRows);
      setHabitLogs(logRows);

      const weeks = weeklyKcalAverages(mealRows, effectiveStart, today);
      setWeekly(weeks.slice(-12));

      const loggedDays = new Set(mealRows.map(e => e.date));
      setMealDaysLogged(loggedDays.size);
    } catch (err) {
      // Offline cache should still resolve; never surface a spinner error.
      console.warn('[kin] progress load', err);
    }
  }, [user, range, today, profile?.createdAt]);

  useEffect(() => {
    if (!user) {
      return;
    }
    return subscribeToHabits(user.uid, setHabits);
  }, [user]);

  useEffect(() => {
    loadRangeData();
  }, [loadRangeData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRangeData();
    setRefreshing(false);
  }, [loadRangeData]);

  const points = useMemo(
    () => weights.map(w => ({date: w.date, kg: w.kg})),
    [weights],
  );
  const trend = useMemo(() => movingAverage(points), [points]);
  const change = netChange(trend);

  const latest = weights.length
    ? weights[weights.length - 1]
    : null;

  const changeColor =
    change != null && goalKg != null && latest != null
      ? towardGoal(change, latest.kg, goalKg)
        ? 'moss'
        : 'warmGray'
      : 'warmGray';

  const consistency = useMemo(() => {
    const rows = habitConsistency(habits, habitLogs, rangeStart, today);
    return [...rows].sort((a, b) => {
      const ra = a.possibleDays > 0 ? a.completedDays / a.possibleDays : 0;
      const rb = b.possibleDays > 0 ? b.completedDays / b.possibleDays : 0;
      return rb - ra;
    });
  }, [habits, habitLogs, rangeStart, today]);

  const habitById = useMemo(() => {
    const map = new Map<string, Habit>();
    for (const h of habits) {
      map.set(h.id, h);
    }
    return map;
  }, [habits]);

  const toGoalLabel = (() => {
    if (latest == null || goalKg == null) {
      return {text: '—', color: 'warmGray' as const};
    }
    if (goalReached(latest.kg, goalKg, startKg)) {
      return {text: 'Reached', color: 'moss' as const};
    }
    const diff = Math.abs(latest.kg - goalKg);
    return {
      text: `${diff.toLocaleString(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })} kg`,
      color: 'plum' as const,
    };
  })();

  const changeLabel =
    change == null
      ? '—'
      : `${change > 0 ? '+' : ''}${change.toLocaleString(undefined, {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        })} kg`;

  const nowLabel = latest
    ? `${latest.kg.toLocaleString(undefined, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })} kg`
    : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.plum}
          />
        }>
        <View style={styles.header}>
          <Text variant="h1" color="plum">
            Progress
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Settings">
            <Settings2 size={22} color={colors.plum} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.segments}>
          {RANGES.map(r => {
            const selected = range === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRange(r.key)}
                style={[styles.chip, selected && styles.chipSelected]}
                accessibilityRole="button"
                accessibilityState={{selected}}>
                <Text
                  variant="caption"
                  color={selected ? 'papaya' : 'plum'}
                  style={styles.chipLabel}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Weight */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="caption" color="warmGray">
                Now
              </Text>
              <Text variant="h3" color="plum" style={styles.statValue}>
                {nowLabel}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="caption" color="warmGray">
                Change
              </Text>
              <Text
                variant="h3"
                color={change == null ? 'warmGray' : changeColor}
                style={styles.statValue}>
                {changeLabel}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="caption" color="warmGray">
                To goal
              </Text>
              <Text
                variant="h3"
                color={toGoalLabel.color}
                style={styles.statValue}>
                {toGoalLabel.text}
              </Text>
            </View>
          </View>

          <WeightChart points={points} trend={trend} goalKg={goalKg} />

          <Text variant="caption" color="warmGray" style={styles.chartNote}>
            The line is a 7-day average. Day-to-day dots bounce around — that's
            water, not fat.
          </Text>

          <Button
            label="Log weight"
            variant="ghost"
            onPress={() =>
              navigation.navigate('Today', {screen: 'LogWeight'})
            }
            style={styles.logWeight}
          />
        </View>

        {/* Eating */}
        <View style={styles.card}>
          <Text variant="h3" color="plum" style={styles.cardTitle}>
            Eating
          </Text>
          {mealDaysLogged < 7 ? (
            <Text variant="caption" color="warmGray">
              A couple of weeks of logging and patterns start to show.
            </Text>
          ) : (
            <>
              {weekly.map(w => {
                const ratio = Math.min(w.avgKcal / dailyTarget, 1);
                const over = w.avgKcal > dailyTarget;
                return (
                  <View key={w.weekStart} style={styles.weekRow}>
                    <Text
                      variant="caption"
                      color="warmGray"
                      style={styles.weekLabel}>
                      {formatWeekRange(w.weekStart)}
                    </Text>
                    <View style={styles.weekBarTrack}>
                      <View
                        style={[
                          styles.weekBarFill,
                          {
                            width: `${ratio * 100}%`,
                            backgroundColor: over
                              ? colors.marigold
                              : colors.moss,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.weekValues}>
                      <Text
                        variant="caption"
                        color="plum"
                        style={styles.tabular}>
                        {w.avgKcal.toLocaleString()} kcal
                      </Text>
                      <Text variant="caption" color="warmGray" style={styles.tabular}>
                        {w.daysLogged}/7 days
                      </Text>
                    </View>
                  </View>
                );
              })}
              <Text variant="caption" color="warmGray" style={styles.cardFoot}>
                Averages only count days you logged.
              </Text>
            </>
          )}
        </View>

        {/* Habits */}
        <View style={styles.card}>
          <Text variant="h3" color="plum" style={styles.cardTitle}>
            Habits
          </Text>
          {consistency.length === 0 ? (
            <Text variant="caption" color="warmGray">
              Add a habit and its consistency shows up here.
            </Text>
          ) : (
            consistency.map(row => {
              const habit = habitById.get(row.habitId);
              const Icon = getHabitIcon(habit?.icon ?? 'Sparkles');
              const ratio =
                row.possibleDays > 0
                  ? row.completedDays / row.possibleDays
                  : 0;
              return (
                <View key={row.habitId} style={styles.habitRow}>
                  <View style={styles.habitIcon}>
                    <Icon
                      size={14}
                      color={colors.warmGray}
                      strokeWidth={1.8}
                    />
                  </View>
                  <View style={styles.habitBody}>
                    <View style={styles.habitTop}>
                      <Text
                        variant="bodyMedium"
                        color="plum"
                        style={styles.habitName}
                        numberOfLines={1}>
                        {row.name}
                      </Text>
                      <Text
                        variant="caption"
                        color="warmGray"
                        style={styles.tabular}>
                        {row.completedDays} of {row.possibleDays} days
                      </Text>
                    </View>
                    <View style={styles.habitTrack}>
                      <View
                        style={[
                          styles.habitFill,
                          {width: `${Math.min(ratio, 1) * 100}%`},
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.papaya},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipSelected: {
    backgroundColor: colors.plum,
    borderColor: colors.plum,
  },
  chipLabel: {
    fontVariant: ['tabular-nums'],
  },
  card: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.md,
  },
  cardFoot: {
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: spacing.xs,
  },
  statValue: {
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  chartNote: {
    marginTop: spacing.md,
  },
  logWeight: {
    marginTop: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  weekLabel: {
    width: 72,
  },
  weekBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
  },
  weekBarFill: {
    height: 8,
    borderRadius: radius.pill,
  },
  weekValues: {
    width: 72,
    alignItems: 'flex-end',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  habitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitBody: {
    flex: 1,
  },
  habitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  habitName: {
    flex: 1,
  },
  habitTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
  },
  habitFill: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.moss,
  },
});
