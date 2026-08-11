import React, {forwardRef, useState} from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import {Eye, EyeOff} from 'lucide-react-native';
import {colors, spacing, radius, typography} from '../theme';
import {Text} from './Text';

type Props = TextInputProps & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    value,
    onChangeText,
    error,
    secureTextEntry,
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isSecure = !!secureTextEntry && !visible;

  const borderColor = error
    ? colors.clay
    : focused
      ? colors.plum
      : colors.hairline;

  return (
    <View style={styles.wrap}>
      <Text variant="eyebrow" color="warmGray" style={styles.label}>
        {label}
      </Text>
      <View style={[styles.field, {borderColor}]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          placeholderTextColor={colors.warmGray}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setVisible(v => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
            {visible ? (
              <EyeOff size={18} color={colors.warmGray} />
            ) : (
              <Eye size={18} color={colors.warmGray} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="clay" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    marginBottom: 0,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    ...typography.body,
    color: colors.plum,
  },
  error: {
    marginTop: 0,
  },
});
