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

export function MealsScreen() {
  return (
    <Screen scroll>
      <Text variant="eyebrow" color="warmGray" style={styles.eyebrow}>
        {today}
      </Text>
      <Text variant="h1" style={styles.heading}>
        Today's plate.
      </Text>
      <Text variant="body" color="ink60" style={styles.body}>
        A gentle log of what you eat, with a small library of vegetarian dishes
        to make it quick.
      </Text>
      <Text variant="caption" color="warmGray" style={styles.note}>
        Meal log ships in prompt 04.
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
