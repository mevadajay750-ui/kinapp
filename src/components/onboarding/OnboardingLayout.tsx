import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '../Text';
import {colors, spacing} from '../../theme';

type Props = {
  step: 1 | 2 | 3 | 4;
  eyebrow: string;
  title: string;
  body?: string;
  leading?: React.ReactNode;
  children?: React.ReactNode;
  onBack?: () => void;
  footer: React.ReactNode;
};

function ProgressDots({step}: {step: number}) {
  const fills = useRef(
    [1, 2, 3, 4].map(i => new Animated.Value(i <= step ? 1 : 0)),
  ).current;

  useEffect(() => {
    Animated.parallel(
      fills.map((anim, index) =>
        Animated.timing(anim, {
          toValue: index + 1 <= step ? 1 : 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [step, fills]);

  return (
    <View
      style={styles.dots}
      accessibilityLabel={`Step ${step} of 4`}
      accessibilityRole="progressbar">
      {fills.map((anim, index) => {
        const backgroundColor = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [colors.hairline, colors.marigold],
        });
        return (
          <Animated.View
            key={index}
            style={[styles.dot, {backgroundColor}]}
          />
        );
      })}
    </View>
  );
}

export function OnboardingLayout({
  step,
  eyebrow,
  title,
  body,
  leading,
  children,
  onBack,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>
        <View
          style={[
            styles.flex,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
            },
          ]}>
          <View style={styles.header}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.back}>
                <ArrowLeft size={22} color={colors.plum} />
              </Pressable>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <ProgressDots step={step} />
            <View style={styles.backPlaceholder} />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {leading ? <View style={styles.leading}>{leading}</View> : null}
            <Text variant="eyebrow" color="warmGray">
              {eyebrow}
            </Text>
            <Text variant="h1" color="plum" style={styles.title}>
              {title}
            </Text>
            {body ? (
              <Text variant="body" color="warmGray" style={styles.body}>
                {body}
              </Text>
            ) : null}
            <View style={styles.children}>{children}</View>
          </ScrollView>

          <View style={styles.footer}>{footer}</View>
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.papaya,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  back: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backPlaceholder: {
    width: 32,
    height: 32,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  leading: {
    marginBottom: spacing.xl,
  },
  title: {
    marginTop: spacing.sm,
  },
  body: {
    marginTop: spacing.lg,
  },
  children: {
    flexGrow: 1,
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
