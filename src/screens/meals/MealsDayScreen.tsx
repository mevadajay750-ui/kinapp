import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {View, Pressable, StyleSheet, ScrollView} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ChevronLeft, ChevronRight, Plus} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {ConfirmSheet} from '../../components/meals/ConfirmSheet';
import {colors, spacing, radius} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {useProfile} from '../../hooks/useProfile';
import {
  localDateKey,
  addDays,
  isToday,
  formatDateLabel,
} from '../../lib/dates';
import {
  subscribeToDay,
  deleteMealEntry,
  MealEntry,
} from '../../lib/meals';
import type {MealCategory} from '../../data/foods';
import type {MealsStackParamList} from '../../navigation/MealsStack';

type Props = NativeStackScreenProps<MealsStackParamList, 'MealsDay'>;

const CATEGORIES: {key: MealCategory; label: string}[] = [
  {key: 'breakfast', label: 'Breakfast'},
  {key: 'lunch', label: 'Lunch'},
  {key: 'dinner', label: 'Dinner'},
  {key: 'snack', label: 'Snacks'},
];

function totalCopy(consumed: number, target: number): string {
  if (consumed === 0) {
    return 'Nothing logged yet. Even a cup of chai counts.';
  }
  const ratio = consumed / target;
  if (ratio < 0.85) {
    const n = Math.max(0, Math.round(target - consumed));
    return `${n.toLocaleString()} kcal to go.`;
  }
  if (ratio <= 1) {
    return 'Nearly there. A lighter supper would round it off.';
  }
  const over = Math.round(consumed - target);
  return `${over.toLocaleString()} over today. Worth noticing, not worth worrying about.`;
}

function SkeletonRows() {
  return (
    <View style={styles.skeletonBlock}>
      {[0, 1, 2].map(i => (
        <View key={i} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

export function MealsDayScreen({navigation}: Props) {
  const {user} = useAuth();
  const {profile} = useProfile();
  const [dateKey, setDateKey] = useState(() => localDateKey());
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<MealEntry | null>(null);

  const target = profile?.dailyKcalTarget ?? 1600;
  const today = isToday(dateKey);

  useEffect(() => {
    if (!user) {
      return;
    }
    setLoading(true);
    setEntries([]);
    const unsub = subscribeToDay(user.uid, dateKey, next => {
      setEntries(next);
      setLoading(false);
    });
    return unsub;
  }, [user, dateKey]);

  const consumed = useMemo(
    () => entries.reduce((sum, e) => sum + e.kcal, 0),
    [entries],
  );
  const protein = useMemo(
    () => entries.reduce((sum, e) => sum + e.proteinG, 0),
    [entries],
  );

  const byCategory = useMemo(() => {
    const map: Record<MealCategory, MealEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const e of entries) {
      if (map[e.category]) {
        map[e.category].push(e);
      }
    }
    return map;
  }, [entries]);

  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const over = consumed > target;

  const onDelete = useCallback(async () => {
    if (!user || !pendingDelete) {
      return;
    }
    const id = pendingDelete.id;
    setPendingDelete(null);
    try {
      await deleteMealEntry(user.uid, id);
    } catch (e) {
      console.warn('[kin] deleteMealEntry failed', e);
    }
  }, [user, pendingDelete]);

  return (
    <Screen>
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={styles.dateStrip}>
          <Pressable
            onPress={() => setDateKey(k => addDays(k, -1))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Previous day">
            <ChevronLeft size={22} color={colors.plum} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.dateCenter}>
            <Text variant="h2" color="plum" style={styles.dateLabel}>
              {formatDateLabel(dateKey)}
            </Text>
            {!today ? (
              <Pressable
                onPress={() => setDateKey(localDateKey())}
                hitSlop={8}
                accessibilityRole="button">
                <Text variant="small" color="marigold">
                  Back to today
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              if (!today) {
                setDateKey(k => addDays(k, 1));
              }
            }}
            disabled={today}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Next day"
            style={{opacity: today ? 0.35 : 1}}>
            <ChevronRight size={22} color={colors.plum} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text variant="display" color="plum" style={styles.consumed}>
              {consumed.toLocaleString()}
            </Text>
            <Text variant="caption" color="warmGray" style={styles.ofTarget}>
              of {target.toLocaleString()} kcal
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: over ? colors.marigold : colors.moss,
                },
              ]}
            />
          </View>
          <Text variant="caption" color="warmGray" style={styles.copy}>
            {loading ? ' ' : totalCopy(consumed, target)}
          </Text>
          <Text variant="caption" color="warmGray" style={styles.protein}>
            {Math.round(protein).toLocaleString()} g protein
          </Text>
        </View>

        {loading ? (
          <SkeletonRows />
        ) : (
          CATEGORIES.map(({key, label}) => {
            const section = byCategory[key];
            const subtotal = section.reduce((s, e) => s + e.kcal, 0);
            const empty = section.length === 0;
            const addLabel =
              key === 'snack' ? 'Add snacks' : `Add ${key}`;

            return (
              <View key={key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3" color="plum">
                    {label}
                  </Text>
                  {!empty ? (
                    <Text variant="caption" color="warmGray">
                      {subtotal.toLocaleString()} kcal
                    </Text>
                  ) : null}
                </View>

                {section.map((entry, index) => (
                  <View key={entry.id}>
                    <Pressable
                      onLongPress={() => setPendingDelete(entry)}
                      delayLongPress={350}
                      style={styles.entryRow}
                      accessibilityRole="button"
                      accessibilityHint="Long press to remove">
                      <View style={styles.entryLeft}>
                        <Text variant="bodyMedium" color="plum">
                          {entry.name}
                        </Text>
                        <Text variant="caption" color="warmGray">
                          {entry.serving}
                          {entry.portions !== 1
                            ? ` × ${entry.portions}`
                            : ''}
                        </Text>
                      </View>
                      <View style={styles.kcalPill}>
                        <Text
                          variant="caption"
                          color="plum"
                          style={styles.tabular}>
                          {entry.kcal.toLocaleString()}
                        </Text>
                      </View>
                    </Pressable>
                    {index < section.length - 1 ? (
                      <View style={styles.divider} />
                    ) : null}
                  </View>
                ))}

                <Pressable
                  onPress={() =>
                    navigation.navigate('AddFood', {category: key, dateKey})
                  }
                  style={[styles.addRow, !empty && styles.addRowQuiet]}
                  accessibilityRole="button">
                  <Plus
                    size={16}
                    color={colors.warmGray}
                    strokeWidth={1.8}
                  />
                  <Text
                    variant="body"
                    color="warmGray"
                    style={!empty ? styles.addQuiet : undefined}>
                    {addLabel}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <ConfirmSheet
        visible={!!pendingDelete}
        title={pendingDelete?.name ?? ''}
        body="Remove this from the log?"
        confirmLabel="Remove"
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  dateCenter: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateLabel: {
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  consumed: {
    fontVariant: ['tabular-nums'],
  },
  ofTarget: {
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: radius.pill,
  },
  copy: {
    marginTop: spacing.md,
  },
  protein: {
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  entryLeft: {
    flex: 1,
    gap: 2,
  },
  kcalPill: {
    backgroundColor: colors.blush,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  divider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  addRowQuiet: {
    opacity: 0.75,
  },
  addQuiet: {
    opacity: 0.9,
  },
  skeletonBlock: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  skeletonRow: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.hairline,
  },
});
