import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Input} from '../../components/Input';
import {Button} from '../../components/Button';
import {spacing} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {localDateKey} from '../../lib/dates';
import {
  setWeight,
  subscribeToLatestWeight,
  validateWeightKg,
  WEIGHT_VALIDATION_MESSAGE,
  WeightEntry,
} from '../../lib/weights';
import type {TodayStackParamList} from '../../navigation/TodayStack';

type Props = NativeStackScreenProps<TodayStackParamList, 'LogWeight'>;

export function LogWeightScreen({navigation}: Props) {
  const {user} = useAuth();
  const [latest, setLatest] = useState<WeightEntry | null>(null);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    const unsub = subscribeToLatestWeight(user.uid, entry => {
      setLatest(entry);
      setReady(true);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (prefilled || !ready) {
      return;
    }
    if (latest) {
      setValue(String(latest.kg));
    }
    setPrefilled(true);
  }, [latest, ready, prefilled]);

  const parsed = useMemo(() => {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }, [value]);

  const onSave = async () => {
    if (!user) {
      return;
    }
    if (!validateWeightKg(parsed)) {
      setError(WEIGHT_VALIDATION_MESSAGE);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await setWeight(user.uid, localDateKey(), parsed);
      navigation.goBack();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : WEIGHT_VALIDATION_MESSAGE;
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Text variant="h2" color="plum" style={styles.title}>
        Today's weight
      </Text>
      <Text variant="caption" color="warmGray" style={styles.body}>
        Weigh yourself at a consistent time — first thing in the morning works
        well. Day-to-day swings are mostly water.
      </Text>
      <Input
        label="Weight"
        value={value}
        onChangeText={text => {
          setValue(text);
          if (error) {
            setError('');
          }
        }}
        keyboardType="decimal-pad"
        suffix="kg"
        error={error || undefined}
        selectTextOnFocus
        style={styles.input}
      />
      <Button
        label="Save"
        onPress={onSave}
        loading={saving}
        style={styles.save}
      />
      <Button
        label="Cancel"
        variant="ghost"
        onPress={() => navigation.goBack()}
        style={styles.cancel}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xl,
  },
  body: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    fontVariant: ['tabular-nums'],
  },
  save: {
    marginTop: spacing.xl,
  },
  cancel: {
    marginTop: spacing.md,
  },
});
