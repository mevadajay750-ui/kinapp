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

export function ProgressScreen() {
  return (
    <Screen scroll>
      <Text variant="eyebrow" color="warmGray" style={styles.eyebrow}>
        {today}
      </Text>
      <Text variant="h1" style={styles.heading}>
        Over time.
      </Text>
      <Text variant="body" color="ink60" style={styles.body}>
        The shape of your weeks and months. Weight, streaks, and quiet wins.
      </Text>
      <Text variant="caption" color="warmGray" style={styles.note}>
        Progress views ship in prompt 06.
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
