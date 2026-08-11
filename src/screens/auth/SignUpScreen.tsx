import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {KinLogo} from '../../components/KinLogo';
import {spacing} from '../../theme';

export function SignUpScreen() {
  return (
    <Screen style={styles.center}>
      <View style={styles.content}>
        <KinLogo size={72} />
        <Text variant="h1" style={styles.heading}>
          Begin, gently.
        </Text>
        <Text variant="body" color="ink60">
          A quiet space for meals, habits, and how you feel.
        </Text>
        <Text variant="caption" color="warmGray" style={styles.note}>
          Auth flow ships in prompt 02.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  heading: {
    marginTop: spacing.xl,
  },
  note: {
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});
