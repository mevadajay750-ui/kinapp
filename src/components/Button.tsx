import React from 'react';
import {Pressable, View, StyleSheet, ViewStyle} from 'react-native';
import {colors, spacing, radius} from '../theme';
import {Text} from './Text';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        pressed && {opacity: 0.85},
        disabled && {opacity: 0.4},
        style,
      ]}>
      {isPrimary && <View style={styles.dot} />}
      <Text variant="bodyMedium" color={isPrimary ? 'papaya' : 'plum'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
  },
  primary: {backgroundColor: colors.plum},
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.marigold,
  },
});
