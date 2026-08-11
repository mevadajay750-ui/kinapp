import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {useAuth} from '../../hooks/useAuth';
import {useProfile} from '../../hooks/useProfile';
import {authErrorMessage} from '../../lib/authErrors';
import {spacing} from '../../theme';

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function ProgressScreen() {
  const {signOut} = useAuth();
  const {profile, updateProfile} = useProfile();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignOut = async () => {
    setError('');
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onResetOnboarding = async () => {
    setError('');
    setResetLoading(true);
    try {
      await updateProfile({onboardingComplete: false});
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  const start = profile?.startWeightKg;
  const goal = profile?.goalWeightKg;
  const goalIsAbove =
    start != null && goal != null && goal > start;

  const onFlipGoal = async () => {
    if (start == null) {
      setError('No start weight on profile.');
      return;
    }
    setError('');
    setGoalLoading(true);
    try {
      const nextGoal = goalIsAbove
        ? Math.round((start - 5) * 10) / 10
        : Math.round((start + 5) * 10) / 10;
      await updateProfile({goalWeightKg: nextGoal});
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoalLoading(false);
    }
  };

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
        Progress views ship in prompt 07.
      </Text>

      {__DEV__ ? (
        <View style={styles.devControls}>
          {/* TODO: remove before release — dev-only controls */}
          <Button
            label="Sign out"
            variant="ghost"
            onPress={onSignOut}
            loading={loading}
          />
          <Button
            label="Reset onboarding"
            variant="ghost"
            onPress={onResetOnboarding}
            loading={resetLoading}
            style={styles.reset}
          />
          <Button
            label={
              goalIsAbove ? 'Set goal below start' : 'Set goal above start'
            }
            variant="ghost"
            onPress={onFlipGoal}
            loading={goalLoading}
            style={styles.reset}
          />
        </View>
      ) : null}
      {error ? (
        <Text variant="caption" color="clay" style={styles.error}>
          {error}
        </Text>
      ) : null}
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
  devControls: {
    marginTop: spacing.xxxl,
  },
  reset: {
    marginTop: spacing.md,
  },
  error: {
    marginTop: spacing.md,
  },
});
