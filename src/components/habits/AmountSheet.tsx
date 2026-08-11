import React, {useEffect, useState} from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, radius} from '../../theme';
import {Text} from '../Text';
import {Button} from '../Button';
import {Input} from '../Input';

const HOUR_CHIPS = [6, 6.5, 7, 7.5, 8, 8.5];

type Props = {
  visible: boolean;
  name: string;
  unit: string | null;
  initialValue?: number | null;
  onSave: (value: number) => void;
  onClose: () => void;
  loading?: boolean;
};

export function AmountSheet({
  visible,
  name,
  unit,
  initialValue,
  onSave,
  onClose,
  loading,
}: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();

  const isHours =
    (unit ?? '').toLowerCase() === 'hours' ||
    name.trim().toLowerCase() === 'sleep';

  useEffect(() => {
    if (visible) {
      setText(
        initialValue != null && initialValue > 0 ? String(initialValue) : '',
      );
      setError(undefined);
    }
  }, [visible, initialValue, name]);

  const onChip = (v: number) => {
    setText(String(v));
    setError(undefined);
  };

  const onSubmit = () => {
    const value = Number(text);
    if (!Number.isFinite(value) || value <= 0) {
      setError("That doesn't look right. Mind checking?");
      return;
    }
    if (isHours && value > 24) {
      setError("That doesn't look right. Mind checking?");
      return;
    }
    onSave(value);
  };

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
          <Text variant="h3" color="plum" style={styles.title}>
            {name}
          </Text>

          <Input
            value={text}
            onChangeText={t => {
              setText(t);
              setError(undefined);
            }}
            keyboardType="decimal-pad"
            suffix={unit ?? undefined}
            error={error}
            autoFocus
          />

          {isHours ? (
            <View style={styles.chips}>
              {HOUR_CHIPS.map(v => {
                const selected = text === String(v);
                return (
                  <Pressable
                    key={v}
                    onPress={() => onChip(v)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{selected}}>
                    <Text
                      variant="bodyMedium"
                      color={selected ? 'papaya' : 'plum'}
                      style={styles.chipText}>
                      {v}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Button
            label="Save"
            onPress={onSubmit}
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
  title: {
    marginBottom: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.cream,
  },
  chipSelected: {
    backgroundColor: colors.plum,
    borderColor: colors.plum,
  },
  chipText: {
    fontVariant: ['tabular-nums'],
  },
  btn: {
    marginTop: spacing.xl,
  },
});
