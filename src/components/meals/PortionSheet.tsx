import React, {useState, useEffect} from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, radius} from '../../theme';
import {Text} from '../Text';
import {Button} from '../Button';
import type {MealPortion} from '../../lib/meals';

const PORTIONS: {label: string; value: MealPortion}[] = [
  {label: '½', value: 0.5},
  {label: '1', value: 1},
  {label: '1½', value: 1.5},
  {label: '2', value: 2},
  {label: '3', value: 3},
];

type Props = {
  visible: boolean;
  name: string;
  serving: string;
  kcalPerServing: number;
  onAdd: (portions: MealPortion) => void;
  onClose: () => void;
  loading?: boolean;
};

export function PortionSheet({
  visible,
  name,
  serving,
  kcalPerServing,
  onAdd,
  onClose,
  loading,
}: Props) {
  const insets = useSafeAreaInsets();
  const [portions, setPortions] = useState<MealPortion>(1);

  useEffect(() => {
    if (visible) {
      setPortions(1);
    }
  }, [visible, name]);

  const totalKcal = Math.round(kcalPerServing * portions);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, {paddingBottom: insets.bottom + spacing.xl}]}
          onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text variant="h3" color="plum">
            {name}
          </Text>
          <Text variant="caption" color="warmGray" style={styles.serving}>
            {serving}
          </Text>

          <View style={styles.chips}>
            {PORTIONS.map(p => {
              const selected = portions === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => setPortions(p.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{selected}}>
                  <Text
                    variant="bodyMedium"
                    color={selected ? 'papaya' : 'plum'}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            variant="h2"
            color="plum"
            style={styles.kcal}>
            {totalKcal.toLocaleString()} kcal
          </Text>

          <Button
            label="Add"
            onPress={() => onAdd(portions)}
            loading={loading}
            style={styles.btn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(61, 35, 55, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.papaya,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    marginBottom: spacing.lg,
  },
  serving: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.cream,
  },
  chipSelected: {
    backgroundColor: colors.plum,
    borderColor: colors.plum,
  },
  kcal: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.xl,
  },
  btn: {
    marginTop: spacing.sm,
  },
});
