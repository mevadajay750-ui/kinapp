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

export function HabitsScreen() {
  return (
    <Screen scroll>
      <Text variant="eyebrow" color="warmGray" style={styles.eyebrow}>
        {today}
      </Text>
      <Text variant="h1" style={styles.heading}>
        Small, daily.
      </Text>
      <Text variant="body" color="ink60" style={styles.body}>
        The habits you're tending to. Water, walks, sleep, and anything else you
        choose to nurture.
      </Text>
      <Text variant="caption" color="warmGray" style={styles.note}>
        Habit tracking ships in prompt 05.
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
