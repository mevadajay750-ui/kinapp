import React, {useState} from 'react';
import {StyleSheet} from 'react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {useAuth} from '../../hooks/useAuth';
import {authErrorMessage} from '../../lib/authErrors';
import {spacing} from '../../theme';

const today = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function ProgressScreen() {
  const {signOut} = useAuth();
  const [loading, setLoading] = useState(false);
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

      {/* TODO: move to Settings screen */}
      <Button
        label="Sign out"
        variant="ghost"
        onPress={onSignOut}
        loading={loading}
        style={styles.signOut}
      />
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
  signOut: {
    marginTop: spacing.xxxl,
  },
  error: {
    marginTop: spacing.md,
  },
});
