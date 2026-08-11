import React from 'react';
import {StyleSheet} from 'react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {spacing} from '../../theme';

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function TodayScreen() {
  return (
    <Screen scroll>
      <Text variant="eyebrow" color="warmGray" style={styles.eyebrow}>
        {today}
      </Text>
      <Text variant="h1" style={styles.heading}>
        Good morning.
      </Text>
      <Text variant="body" color="ink60" style={styles.body}>
        This is where your day begins. Meals, habits, and how it's all shaping
        up — all on one calm page.
      </Text>
      <Text variant="caption" color="warmGray" style={styles.note}>
        Home dashboard ships in prompt 03.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    marginTop: spacing.xl,
  },
  heading: {
    marginTop: spacing.sm,
  },
  body: {
    marginTop: spacing.lg,
  },
  note: {
    fontStyle: 'italic',
    marginTop: spacing.lg,
  },
});
