import {useCallback, useEffect, useMemo, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {addDays, localDateKey} from '../lib/dates';
import {
  buildQuickAddFoods,
  getMealRange,
  MealEntry,
  QuickAddFood,
  subscribeToDay,
} from '../lib/meals';
import {
  Habit,
  HabitLog,
  subscribeToHabitLogs,
  subscribeToHabits,
} from '../lib/habits';
import {subscribeToLatestWeight, WeightEntry} from '../lib/weights';
import {
  computeDayStats,
  computeHabitProgress,
  DayStats,
  HabitProgress,
} from '../lib/dayStats';
import {useAuth} from './useAuth';

const EMPTY_STATS: DayStats = {
  kcal: 0,
  proteinG: 0,
  entryCount: 0,
  byCategory: {breakfast: 0, lunch: 0, dinner: 0, snack: 0},
};

export type TodayData = {
  dateKey: string;
  stats: DayStats;
  habitProgress: HabitProgress;
  habits: Habit[];
  habitLogs: HabitLog[];
  mealEntries: MealEntry[];
  latestWeight: WeightEntry | null;
  quickAdd: QuickAddFood[];
  /** True until every live source has delivered a first snapshot. */
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
};

export function useTodayData(): TodayData {
  const {user} = useAuth();
  const [dateKey, setDateKey] = useState(() => localDateKey());
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddFood[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [mealsReady, setMealsReady] = useState(false);
  const [habitsReady, setHabitsReady] = useState(false);
  const [logsReady, setLogsReady] = useState(false);
  const [weightReady, setWeightReady] = useState(false);

  const syncDateKey = useCallback(() => {
    const next = localDateKey();
    setDateKey(prev => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        syncDateKey();
      }
    };
    const sub = AppState.addEventListener('change', onChange);

    // Poll lightly while active so an open session past midnight flips the day.
    const interval = setInterval(syncDateKey, 60_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [syncDateKey]);

  const loadQuickAdd = useCallback(async () => {
    if (!user) {
      setQuickAdd([]);
      return;
    }
    const end = localDateKey();
    const start = addDays(end, -13);
    try {
      const entries = await getMealRange(user.uid, start, end);
      setQuickAdd(buildQuickAddFoods(entries, 6));
    } catch (e) {
      console.warn('[kin] getMealRange / quick-add failed', e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      syncDateKey();

      if (!user) {
        setMealEntries([]);
        setHabits([]);
        setHabitLogs([]);
        setLatestWeight(null);
        setQuickAdd([]);
        setMealsReady(true);
        setHabitsReady(true);
        setLogsReady(true);
        setWeightReady(true);
        return;
      }

      // Keep prior data painted; cached snapshots usually fire immediately.

      const unsubMeals = subscribeToDay(user.uid, dateKey, next => {
        setMealEntries(next);
        setMealsReady(true);
      });
      const unsubHabits = subscribeToHabits(user.uid, next => {
        setHabits(next);
        setHabitsReady(true);
      });
      const unsubLogs = subscribeToHabitLogs(user.uid, dateKey, next => {
        setHabitLogs(next);
        setLogsReady(true);
      });
      const unsubWeight = subscribeToLatestWeight(user.uid, next => {
        setLatestWeight(next);
        setWeightReady(true);
      });

      loadQuickAdd();

      return () => {
        unsubMeals();
        unsubHabits();
        unsubLogs();
        unsubWeight();
      };
    }, [user, dateKey, syncDateKey, loadQuickAdd]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      syncDateKey();
      await loadQuickAdd();
    } finally {
      setRefreshing(false);
    }
  }, [syncDateKey, loadQuickAdd]);

  const stats = useMemo(() => computeDayStats(mealEntries), [mealEntries]);
  const habitProgress = useMemo(
    () => computeHabitProgress(habits, habitLogs),
    [habits, habitLogs],
  );

  const loading = !(mealsReady && habitsReady && logsReady && weightReady);

  return {
    dateKey,
    stats: loading && mealEntries.length === 0 ? EMPTY_STATS : stats,
    habitProgress,
    habits,
    habitLogs,
    mealEntries,
    latestWeight,
    quickAdd,
    loading,
    refreshing,
    refresh,
  };
}
