import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, radius} from '../../theme';
import {Text} from '../Text';

type Props = {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onHide: () => void;
};

export function MealToast({visible, message, onUndo, onHide}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 80,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(({finished}) => {
          if (finished) {
            onHide();
          }
        });
      }, 2500);
    } else {
      translateY.setValue(80);
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, message, onHide, translateY, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: Math.max(insets.bottom, spacing.lg) + spacing.xl,
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <View style={styles.pill}>
        <Text variant="bodyMedium" color="plum" style={styles.message}>
          {message}
        </Text>
        <Pressable
          onPress={() => {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }
            onUndo();
            onHide();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Undo">
          <Text variant="bodyMedium" color="marigold">
            Undo
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  message: {
    flex: 1,
  },
});
