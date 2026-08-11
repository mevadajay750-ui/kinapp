import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Check, Plus, Settings2} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {KinLogo} from '../../components/KinLogo';
import {DateStrip} from '../../components/DateStrip';
import {WeekDots} from '../../components/habits/WeekDots';
import {AmountSheet} from '../../components/habits/AmountSheet';
import {getHabitIcon} from '../../components/habits/habitIcons';
import {colors, spacing, radius} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {addDays, localDateKey} from '../../lib/dates';
import {
  Habit,
  HabitLog,
  createHabit,
  getHabitLogRange,
  setHabitValue,
  subscribeToHabitLogs,
  subscribeToHabits,
} from '../../lib/habits';
import type {HabitsStackParamList} from '../../navigation/HabitsStack';

type Props = NativeStackScreenProps<HabitsStackParamList, 'HabitsDay'>;

const SUGGESTIONS: {
  label: string;
  name: string;
  kind: Habit['kind'];
  icon: string;
  target: number | null;
  unit: string | null;
}[] = [
  {
    label: 'Drink water',
    name: 'Drink water',
    kind: 'count',
    icon: 'Droplet',
    target: 8,
    unit: 'glasses',
  },
  {
    label: 'Sleep 7 hours',
    name: 'Sleep',
    kind: 'amount',
    icon: 'Moon',
    target: 7,
    unit: 'hours',
  },
  {
    label: 'Walk after dinner',
    name: 'Walk after dinner',
    kind: 'binary',
    icon: 'Footprints',
    target: null,
    unit: null,
  },
  {
    label: '10 minutes of sun',
    name: '10 minutes of sun',
    kind: 'binary',
    icon: 'Sun',
    target: null,
    unit: null,
  },
  {
    label: 'Read before bed',
    name: 'Read before bed',
    kind: 'binary',
    icon: 'BookOpen',
    target: null,
    unit: null,
  },
  {
    label: 'No screens after 10',
    name: 'No screens after 10',
    kind: 'binary',
    icon: 'Moon',
    target: null,
    unit: null,
  },
];

function SkeletonRows() {
  return (
    <View style={styles.skeletonBlock}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

export function HabitsDayScreen({navigation}: Props) {
  const {user} = useAuth();
  const [dateKey, setDateKey] = useState(() => localDateKey());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayLogs, setDayLogs] = useState<HabitLog[]>([]);
  const [rangeLogs, setRangeLogs] = useState<HabitLog[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [amountHabit, setAmountHabit] = useState<Habit | null>(null);
  const [amountSaving, setAmountSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setHabitsLoading(true);
    const unsub = subscribeToHabits(user.uid, next => {
      setHabits(next);
      setHabitsLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    setLogsLoading(true);
    setDayLogs([]);
    const unsub = subscribeToHabitLogs(user.uid, dateKey, next => {
      setDayLogs(next);
      setLogsLoading(false);
    });
    return unsub;
  }, [user, dateKey]);

  const refreshRange = useCallback(async () => {
    if (!user) {
      return;
    }
    const start = addDays(dateKey, -6);
    try {
      const logs = await getHabitLogRange(user.uid, start, dateKey);
      setRangeLogs(logs);
    } catch (e) {
      console.warn('[kin] getHabitLogRange failed', e);
    }
  }, [user, dateKey]);

  useEffect(() => {
    refreshRange();
  }, [refreshRange, dayLogs]);

  const logsById = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of rangeLogs) {
      map.set(log.id, log);
    }
    for (const log of dayLogs) {
      map.set(log.id, log);
    }
    return map;
  }, [rangeLogs, dayLogs]);

  const dayLogByHabit = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of dayLogs) {
      map.set(log.habitId, log);
    }
    return map;
  }, [dayLogs]);

  const completedToday = useMemo(
    () => habits.filter(h => dayLogByHabit.get(h.id)?.completed).length,
    [habits, dayLogByHabit],
  );

  const loading = habitsLoading || (habits.length > 0 && logsLoading);

  const writeValue = useCallback(
    async (habit: Habit, value: number) => {
      if (!user) {
        return;
      }
      try {
        await setHabitValue(user.uid, habit, dateKey, value);
      } catch (e) {
        console.warn('[kin] setHabitValue failed', e);
      }
    },
    [user, dateKey],
  );

  const onToggleBinary = useCallback(
    (habit: Habit) => {
      const current = dayLogByHabit.get(habit.id)?.value ?? 0;
      writeValue(habit, current === 1 ? 0 : 1);
    },
    [dayLogByHabit, writeValue],
  );

  const onCountDelta = useCallback(
    (habit: Habit, delta: number) => {
      const current = dayLogByHabit.get(habit.id)?.value ?? 0;
      const next = Math.max(0, current + delta);
      writeValue(habit, next);
    },
    [dayLogByHabit, writeValue],
  );

  const onSaveAmount = useCallback(
    async (value: number) => {
      if (!amountHabit) {
        return;
      }
      setAmountSaving(true);
      try {
        await writeValue(amountHabit, value);
        setAmountHabit(null);
      } finally {
        setAmountSaving(false);
      }
    },
    [amountHabit, writeValue],
  );

  const onSuggestion = useCallback(
    async (s: (typeof SUGGESTIONS)[number]) => {
      if (!user) {
        return;
      }
      try {
        await createHabit(user.uid, {
          name: s.name,
          kind: s.kind,
          icon: s.icon,
          target: s.target,
          unit: s.unit,
        });
      } catch (e) {
        console.warn('[kin] createHabit failed', e);
      }
    },
    [user],
  );

  const summary =
    habits.length > 0 && completedToday === habits.length
      ? 'All done today. Nicely kept.'
      : `${completedToday} of ${habits.length} today`;

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1" color="plum">
          Habits
        </Text>
        <Pressable
          onPress={() => navigation.navigate('ManageHabits')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Manage habits">
          <Settings2 size={22} color={colors.plum} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <DateStrip dateKey={dateKey} onChange={setDateKey} />

        {loading ? (
          <SkeletonRows />
        ) : habits.length === 0 ? (
          <EmptyState
            onAdd={() => navigation.navigate('EditHabit', {})}
            onSuggestion={onSuggestion}
          />
        ) : (
          <>
            <Text variant="caption" color="warmGray" style={styles.summary}>
              {summary}
            </Text>

            <View style={styles.list}>
              {habits.map(habit => {
                const log = dayLogByHabit.get(habit.id);
                return (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    log={log}
                    dateKey={dateKey}
                    logsById={logsById}
                    onToggleBinary={() => onToggleBinary(habit)}
                    onCountPlus={() => onCountDelta(habit, 1)}
                    onCountMinus={() => onCountDelta(habit, -1)}
                    onOpenAmount={() => setAmountHabit(habit)}
                  />
                );
              })}
            </View>

            <Button
              label="Add a habit"
              variant="ghost"
              onPress={() => navigation.navigate('EditHabit', {})}
              style={styles.addBtn}
            />
          </>
        )}
      </ScrollView>

      <AmountSheet
        visible={!!amountHabit}
        name={amountHabit?.name ?? ''}
        unit={amountHabit?.unit ?? null}
        initialValue={
          amountHabit
            ? dayLogByHabit.get(amountHabit.id)?.value ?? null
            : null
        }
        onSave={onSaveAmount}
        onClose={() => setAmountHabit(null)}
        loading={amountSaving}
      />
    </Screen>
  );
}

function EmptyState({
  onAdd,
  onSuggestion,
}: {
  onAdd: () => void;
  onSuggestion: (s: (typeof SUGGESTIONS)[number]) => void;
}) {
  return (
    <View style={styles.empty}>
      <KinLogo size={32} variant="mark" />
      <Text variant="h3" color="plum" style={styles.emptyTitle}>
        Nothing here yet.
      </Text>
      <Text variant="body" color="warmGray" style={styles.emptyBody}>
        Habits are yours to choose. Start with one you could do on your worst
        day.
      </Text>
      <Button label="Add your first habit" onPress={onAdd} style={styles.emptyBtn} />
      <Text variant="caption" color="warmGray" style={styles.suggestionsLabel}>
        Suggestions
      </Text>
      <View style={styles.chips}>
        {SUGGESTIONS.map(s => (
          <Pressable
            key={s.label}
            onPress={() => onSuggestion(s)}
            style={styles.chip}
            accessibilityRole="button">
            <Text variant="small" color="plum">
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function HabitRow({
  habit,
  log,
  dateKey,
  logsById,
  onToggleBinary,
  onCountPlus,
  onCountMinus,
  onOpenAmount,
}: {
  habit: Habit;
  log: HabitLog | undefined;
  dateKey: string;
  logsById: Map<string, HabitLog>;
  onToggleBinary: () => void;
  onCountPlus: () => void;
  onCountMinus: () => void;
  onOpenAmount: () => void;
}) {
  const Icon = getHabitIcon(habit.icon);
  const value = log?.value ?? 0;
  const completed = !!log?.completed;
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

  const iconBg = completed ? colors.moss : colors.blush;
  const iconColor = completed ? colors.papaya : colors.warmGray;

  const middle = (
    <View style={styles.middle}>
      <Text variant="bodyMedium" color="plum">
        {habit.name}
      </Text>
      {habit.kind === 'count' ? (
        <CountPips value={value} target={habit.target ?? 0} />
      ) : (
        <WeekDots
          habitId={habit.id}
          createdAt={habit.createdAt}
          endKey={dateKey}
          logsById={logsById}
        />
      )}
    </View>
  );

  if (habit.kind === 'binary') {
    return (
      <Pressable
        onPress={onToggleBinary}
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityState={{checked: completed}}>
        <View style={[styles.iconCircle, {backgroundColor: iconBg}]}>
          <Icon size={18} color={iconColor} strokeWidth={1.8} />
        </View>
        {middle}
        <Animated.View
          style={[
            styles.checkbox,
            completed && styles.checkboxDone,
            {transform: [{scale}]},
          ]}>
          {completed ? (
            <Check size={16} color={colors.papaya} strokeWidth={2.2} />
          ) : null}
        </Animated.View>
      </Pressable>
    );
  }

  if (habit.kind === 'count') {
    const target = habit.target ?? 0;
    return (
      <View style={styles.row}>
        <View style={[styles.iconCircle, {backgroundColor: iconBg}]}>
          <Icon size={18} color={iconColor} strokeWidth={1.8} />
        </View>
        <View style={styles.middle}>
          <Text variant="bodyMedium" color="plum">
            {habit.name}
          </Text>
          <CountPips value={value} target={target} />
          <Text variant="caption" color="warmGray" style={styles.countLabel}>
            {value} / {target} {habit.unit ?? ''}
          </Text>
          <WeekDots
            habitId={habit.id}
            createdAt={habit.createdAt}
            endKey={dateKey}
            logsById={logsById}
          />
        </View>
        <Pressable
          onPress={onCountPlus}
          onLongPress={onCountMinus}
          delayLongPress={350}
          accessibilityRole="button"
          accessibilityLabel="Add one"
          accessibilityHint="Long press to remove one"
          style={styles.plusBtn}>
          <Plus size={18} color={colors.papaya} strokeWidth={2} />
        </Pressable>
      </View>
    );
  }

  // amount
  return (
    <Pressable
      onPress={onOpenAmount}
      style={styles.row}
      accessibilityRole="button">
      <View style={[styles.iconCircle, {backgroundColor: iconBg}]}>
        <Icon size={18} color={iconColor} strokeWidth={1.8} />
      </View>
      {middle}
      <View style={styles.amountRight}>
        {value > 0 ? (
          <>
            <Text variant="h3" color="plum" style={styles.amountValue}>
              {value}
            </Text>
            {habit.unit ? (
              <Text variant="caption" color="warmGray">
                {habit.unit}
              </Text>
            ) : null}
          </>
        ) : (
          <Text variant="h3" color="warmGray">
            —
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function CountPips({value, target}: {value: number; target: number}) {
  if (target > 12) {
    const progress = target > 0 ? Math.min(value / target, 1) : 0;
    return (
      <View style={styles.barTrack}>
        <View style={[styles.barFill, {width: `${progress * 100}%`}]} />
      </View>
    );
  }
  const pips = Array.from({length: Math.max(target, 0)}, (_, i) => i < value);
  return (
    <View style={styles.pips}>
      {pips.map((filled, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            {
              backgroundColor: filled ? colors.moss : 'transparent',
              borderColor: filled ? colors.moss : colors.hairline,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  scroll: {paddingBottom: spacing.xxxl},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  summary: {
    marginBottom: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  checkboxDone: {
    backgroundColor: colors.moss,
    borderColor: colors.moss,
  },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLabel: {
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  amountRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  amountValue: {
    fontVariant: ['tabular-nums'],
  },
  pips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: spacing.xs,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
  },
  barTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    backgroundColor: colors.moss,
    borderRadius: radius.pill,
  },
  addBtn: {
    marginTop: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  suggestionsLabel: {
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.cream,
  },
  skeletonBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  skeletonRow: {
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.hairline,
  },
});
