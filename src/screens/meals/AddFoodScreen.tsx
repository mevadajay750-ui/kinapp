import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ArrowLeft, Plus, Search, X} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '../../components/Text';
import {Input} from '../../components/Input';
import {Button} from '../../components/Button';
import {MealToast} from '../../components/meals/MealToast';
import {PortionSheet} from '../../components/meals/PortionSheet';
import {colors, spacing, radius} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {searchFoods} from '../../lib/foodSearch';
import {
  addMealEntry,
  deleteMealEntry,
  fetchRecentFoods,
  MealPortion,
  RecentFood,
} from '../../lib/meals';
import {FOODS, Food, FoodWeight} from '../../data/foods';
import type {MealsStackParamList} from '../../navigation/MealsStack';

type Props = NativeStackScreenProps<MealsStackParamList, 'AddFood'>;

type ListItem =
  | {kind: 'header'; title: string}
  | {kind: 'food'; food: Food}
  | {kind: 'recent'; recent: RecentFood};

function categoryTitle(category: string): string {
  if (category === 'snack') {
    return 'Add snacks';
  }
  return `Add ${category}`;
}

function weightStyles(weight: FoodWeight) {
  switch (weight) {
    case 'light':
      return {color: 'moss' as const, bg: colors.cream};
    case 'hearty':
      return {color: 'marigold' as const, bg: colors.blush};
    default:
      return {color: 'warmGray' as const, bg: colors.cream};
  }
}

export function AddFoodScreen({navigation, route}: Props) {
  const {category, dateKey} = route.params;
  const {user} = useAuth();
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<RecentFood[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    entryId: string;
  } | null>(null);
  const [portionFood, setPortionFood] = useState<{
    foodId: string | null;
    name: string;
    serving: string;
    kcal: number;
    proteinG: number;
  } | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    fetchRecentFoods(user.uid, category)
      .then(list => {
        if (!cancelled) {
          setRecents(list);
        }
      })
      .catch(e => console.warn('[kin] fetchRecentFoods', e));
    return () => {
      cancelled = true;
    };
  }, [user, category]);

  const results = useMemo(
    () => searchFoods(query, category),
    [query, category],
  );

  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    const emptyQuery = !query.trim();

    if (emptyQuery && recents.length > 0) {
      items.push({kind: 'header', title: 'Recent'});
      for (const r of recents) {
        items.push({kind: 'recent', recent: r});
      }
      items.push({kind: 'header', title: 'Library'});
    }

    for (const food of results) {
      items.push({kind: 'food', food});
    }
    return items;
  }, [query, recents, results]);

  const persist = useCallback(
    async (args: {
      foodId: string | null;
      name: string;
      serving: string;
      kcal: number;
      proteinG: number;
      portions: MealPortion;
    }) => {
      if (!user) {
        return;
      }
      setAdding(true);
      try {
        const entryId = await addMealEntry(user.uid, {
          date: dateKey,
          category,
          foodId: args.foodId,
          name: args.name,
          serving: args.serving,
          portions: args.portions,
          kcal: Math.round(args.kcal * args.portions),
          proteinG:
            Math.round(args.proteinG * args.portions * 10) / 10,
        });
        setToast({message: `${args.name} added`, entryId});
        setPortionFood(null);
      } catch (e) {
        console.warn('[kin] addMealEntry failed', e);
      } finally {
        setAdding(false);
      }
    },
    [user, dateKey, category],
  );

  const addQuick = useCallback(
    (item: {
      foodId: string | null;
      name: string;
      serving: string;
      kcal: number;
      proteinG: number;
    }) => {
      void persist({...item, portions: 1});
    },
    [persist],
  );

  const resolveRecent = useCallback((recent: RecentFood) => {
    if (recent.foodId) {
      const lib = FOODS.find(f => f.id === recent.foodId);
      if (lib) {
        return {
          foodId: lib.id,
          name: lib.name,
          serving: lib.serving,
          kcal: lib.kcal,
          proteinG: lib.proteinG,
        };
      }
    }
    return {
      foodId: recent.foodId,
      name: recent.name,
      serving: recent.serving || '1 serving',
      kcal: recent.kcal,
      proteinG: recent.proteinG,
    };
  }, []);

  const renderItem: ListRenderItem<ListItem> = ({item}) => {
    if (item.kind === 'header') {
      return (
        <Text variant="eyebrow" color="warmGray" style={styles.sectionTitle}>
          {item.title}
        </Text>
      );
    }

    if (item.kind === 'recent') {
      const resolved = resolveRecent(item.recent);
      return (
        <FoodRow
          name={resolved.name}
          serving={resolved.serving}
          kcal={resolved.kcal}
          proteinG={resolved.proteinG}
          weight={undefined}
          onPressRow={() => setPortionFood(resolved)}
          onPressPlus={() => addQuick(resolved)}
        />
      );
    }

    const food = item.food;
    const payload = {
      foodId: food.id,
      name: food.name,
      serving: food.serving,
      kcal: food.kcal,
      proteinG: food.proteinG,
    };
    return (
      <FoodRow
        name={food.name}
        serving={food.serving}
        kcal={food.kcal}
        proteinG={food.proteinG}
        weight={food.weight}
        onPressRow={() => setPortionFood(payload)}
        onPressPlus={() => addQuick(payload)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.plum} strokeWidth={1.8} />
        </Pressable>
        <Text variant="h3" color="plum" style={styles.title}>
          {categoryTitle(category)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.search}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods…"
          autoFocus={false}
          autoCorrect={false}
          autoCapitalize="none"
          leftIcon={<Search size={18} color={colors.warmGray} />}
          rightIcon={
            query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search">
                <X size={18} color={colors.warmGray} />
              </Pressable>
            ) : undefined
          }
        />
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, index) => {
          if (item.kind === 'header') {
            return `h-${item.title}`;
          }
          if (item.kind === 'recent') {
            return `r-${item.recent.foodId ?? item.recent.name}-${index}`;
          }
          return item.food.id;
        }}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              label="Add something else"
              variant="ghost"
              onPress={() =>
                navigation.navigate('CustomFood', {category, dateKey})
              }
            />
            <Text variant="caption" color="warmGray" style={styles.note}>
              Calorie figures are averages. Real portions vary, and that's fine
              — patterns over weeks matter more than any single day.
            </Text>
          </View>
        }
      />

      <PortionSheet
        visible={!!portionFood}
        name={portionFood?.name ?? ''}
        serving={portionFood?.serving ?? ''}
        kcalPerServing={portionFood?.kcal ?? 0}
        loading={adding}
        onClose={() => setPortionFood(null)}
        onAdd={portions => {
          if (!portionFood) {
            return;
          }
          void persist({...portionFood, portions});
        }}
      />

      <MealToast
        visible={!!toast}
        message={toast?.message ?? ''}
        onHide={() => setToast(null)}
        onUndo={() => {
          if (user && toast) {
            void deleteMealEntry(user.uid, toast.entryId).catch(e =>
              console.warn('[kin] undo delete failed', e),
            );
          }
        }}
      />
    </SafeAreaView>
  );
}

function FoodRow({
  name,
  serving,
  kcal,
  proteinG,
  weight,
  onPressRow,
  onPressPlus,
}: {
  name: string;
  serving: string;
  kcal: number;
  proteinG: number;
  weight?: FoodWeight;
  onPressRow: () => void;
  onPressPlus: () => void;
}) {
  const w = weight ? weightStyles(weight) : null;

  return (
    <View style={styles.row}>
      <Pressable onPress={onPressRow} style={styles.rowLeft}>
        <Text variant="bodyMedium" color="plum">
          {name}
        </Text>
        <Text variant="caption" color="warmGray">
          {serving} · {kcal} kcal · {proteinG}g protein
        </Text>
      </Pressable>
      {w ? (
        <View style={[styles.weightChip, {backgroundColor: w.bg}]}>
          <Text variant="caption" color={w.color}>
            {weight}
          </Text>
        </View>
      ) : null}
      <Pressable
        onPress={onPressPlus}
        style={styles.plusBtn}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Add ${name}`}>
        <Plus size={18} color={colors.papaya} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.papaya,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
  headerSpacer: {
    width: 22,
  },
  search: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  weightChip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
