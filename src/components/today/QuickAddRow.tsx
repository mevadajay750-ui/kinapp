import React from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {colors, spacing, radius} from '../../theme';
import {Text} from '../Text';
import type {QuickAddFood} from '../../lib/meals';

type Props = {
  foods: QuickAddFood[];
  onAdd: (food: QuickAddFood) => void;
};

/** Hidden when fewer than 3 distinct foods. */
export function QuickAddRow({foods, onAdd}: Props) {
  if (foods.length < 3) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {foods.map(food => {
        const key = food.foodId ?? food.name;
        return (
          <Pressable
            key={key}
            onPress={() => onAdd(food)}
            style={({pressed}) => [styles.chip, pressed && {opacity: 0.85}]}
            accessibilityRole="button"
            accessibilityLabel={`Log ${food.name}, ${food.kcal} calories`}>
            <Text variant="caption" color="plum">
              {food.name}
            </Text>
            <Text variant="caption" color="warmGray" style={styles.kcal}>
              {food.kcal.toLocaleString()}
            </Text>
          </Pressable>
        );
      })}
      {/* spacer so last chip isn't flush */}
      <View style={styles.tail} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kcal: {
    fontVariant: ['tabular-nums'],
  },
  tail: {
    width: 1,
  },
});
