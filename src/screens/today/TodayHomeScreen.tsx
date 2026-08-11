import React, {useCallback, useMemo, useState} from 'react';
import {View, ScrollView, StyleSheet, RefreshControl} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {DayRing} from '../../components/today/DayRing';
import {QuickAddRow} from '../../components/today/QuickAddRow';
import {HabitsStrip} from '../../components/today/HabitsStrip';
import {WeightCard} from '../../components/today/WeightCard';
import {MealToast} from '../../components/meals/MealToast';
import {colors, spacing, radius} from '../../theme';
import {useProfile} from '../../hooks/useProfile';
import {useAuth} from '../../hooks/useAuth';
import {useTodayData} from '../../hooks/useTodayData';
import {formatGreetingDate} from '../../lib/dates';
import {greetingForHour, plateCopy} from '../../lib/dayStats';
import {
  addMealEntry,
  deleteMealEntry,
  QuickAddFood,
} from '../../lib/meals';
import {setHabitValue, Habit} from '../../lib/habits';
import type {TodayStackParamList} from '../../navigation/TodayStack';
import type {TabParamList} from '../../navigation/TabNavigator';

type Props = CompositeScreenProps<
  NativeStackScreenProps<TodayStackParamList, 'TodayHome'>,
  BottomTabScreenProps<TabParamList>
>;

export function TodayHomeScreen({navigation}: Props) {
  const {user} = useAuth();
  const {profile} = useProfile();
  const {
    dateKey,
    stats,
    habitProgress,
    habits,
    habitLogs,
    latestWeight,
    quickAdd,
    loading,
    refreshing,
    refresh,
  } = useTodayData();

  const [toast, setToast] = useState<{message: string; entryId: string} | null>(
    null,
  );

  const target = profile?.dailyKcalTarget ?? 1600;
  const name = profile?.name ?? '';
  const greeting = useMemo(
    () => greetingForHour(new Date().getHours(), name),
    // Recompute when the calendar day flips (dateKey) or name changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, dateKey],
  );
  const dateLabel = useMemo(
    () => formatGreetingDate(new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateKey],
  );

  const goMeals = useCallback(() => {
    navigation.navigate('Meals');
  }, [navigation]);

  const goHabits = useCallback(() => {
    navigation.navigate('Habits');
  }, [navigation]);

  const onQuickAdd = useCallback(
    async (food: QuickAddFood) => {
      if (!user) {
        return;
      }
      try {
        const entryId = await addMealEntry(user.uid, {
          date: dateKey,
          category: food.category,
          foodId: food.foodId,
          name: food.name,
          serving: food.serving,
          portions: 1,
          kcal: food.kcal,
          proteinG: food.proteinG,
        });
        setToast({message: `${food.name} added`, entryId});
      } catch (e) {
        console.warn('[kin] quick-add failed', e);
      }
    },
    [user, dateKey],
  );

  const onUndoToast = useCallback(async () => {
    if (!user || !toast) {
      return;
    }
    try {
      await deleteMealEntry(user.uid, toast.entryId);
    } catch (e) {
      console.warn('[kin] undo quick-add failed', e);
    }
  }, [user, toast]);

  const onToggleBinary = useCallback(
    async (habit: Habit) => {
      if (!user) {
        return;
      }
      const current =
        habitLogs.find(l => l.habitId === habit.id)?.value ?? 0;
      try {
        await setHabitValue(user.uid, habit, dateKey, current === 1 ? 0 : 1);
      } catch (e) {
        console.warn('[kin] toggle habit failed', e);
      }
    },
    [user, habitLogs, dateKey],
  );

  return (
    <Screen>
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.plum}
            colors={[colors.plum]}
          />
        }>
        <Text variant="eyebrow" color="warmGray" style={styles.eyebrow}>
          {dateLabel}
        </Text>
        <Text variant="h1" color="plum" style={styles.greeting}>
          {greeting}
        </Text>

        <View style={styles.ringCard}>
          <DayRing kcal={stats.kcal} target={target} loading={loading} />
          <View style={styles.ringCopy}>
            <Text variant="eyebrow" color="warmGray">
              Today's plate
            </Text>
            <Text variant="caption" color="warmGray" style={styles.plateLine}>
              {loading ? ' ' : plateCopy(stats.kcal, target)}
            </Text>
            <Text variant="caption" color="warmGray" style={styles.protein}>
              {loading
                ? ' '
                : `${Math.round(stats.proteinG).toLocaleString()} g protein`}
            </Text>
            <Button
              label="Log a meal"
              size="small"
              onPress={goMeals}
              style={styles.logMeal}
            />
          </View>
        </View>

        <QuickAddRow foods={quickAdd} onAdd={onQuickAdd} />

        <HabitsStrip
          habits={habits}
          habitLogs={habitLogs}
          progress={habitProgress}
          loading={loading}
          onToggleBinary={onToggleBinary}
          onOpenHabits={goHabits}
        />

        <WeightCard
          latestWeight={latestWeight}
          startWeightKg={profile?.startWeightKg ?? null}
          goalWeightKg={profile?.goalWeightKg ?? null}
          loading={loading}
          onLogWeight={() => navigation.navigate('LogWeight')}
        />

        <Text variant="caption" color="warmGray" style={styles.footer}>
          Kin is a journal, not medical advice.
        </Text>
      </ScrollView>

      <MealToast
        visible={!!toast}
        message={toast?.message ?? ''}
        onUndo={onUndoToast}
        onHide={() => setToast(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  scroll: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  eyebrow: {
    marginTop: spacing.xl,
  },
  greeting: {
    marginTop: spacing.xs,
  },
  ringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  ringCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  plateLine: {
    marginTop: spacing.xs,
  },
  protein: {
    fontVariant: ['tabular-nums'],
  },
  logMeal: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
