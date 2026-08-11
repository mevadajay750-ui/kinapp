import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import {colors, spacing, radius} from '../theme';
import {Text} from './Text';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'destructive';
  size?: 'default' | 'small';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled,
  loading,
  style,
}: Props) {
  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';
  const isFilled = isPrimary || isDestructive;
  const isSmall = size === 'small';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        isSmall ? styles.small : null,
        isPrimary
          ? styles.primary
          : isDestructive
            ? styles.destructive
            : styles.ghost,
        pressed && {opacity: 0.85},
        isDisabled && {opacity: 0.4},
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={isFilled ? colors.papaya : colors.plum} />
      ) : (
        <>
          {isPrimary && <View style={styles.dot} />}
          <Text
            variant={isSmall ? 'small' : 'bodyMedium'}
            color={isFilled ? 'papaya' : 'plum'}>
            {label}
          </Text>
        </>
      )}
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
  small: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
  },
  primary: {backgroundColor: colors.plum},
  destructive: {backgroundColor: colors.clay},
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
