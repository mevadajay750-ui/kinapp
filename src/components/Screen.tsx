import React from 'react';
import {View, ScrollView, StyleSheet, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, spacing} from '../theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

export function Screen({children, scroll = false, style}: Props) {
  const Inner = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Inner
        style={[styles.container, style]}
        contentContainerStyle={scroll ? styles.scrollContent : undefined}>
        {children}
      </Inner>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.papaya},
  container: {flex: 1, paddingHorizontal: spacing.lg},
  scrollContent: {paddingBottom: spacing.xxxl},
});
