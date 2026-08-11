import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ArrowLeft} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '../../components/Text';
import {Input} from '../../components/Input';
import {Button} from '../../components/Button';
import {colors, spacing} from '../../theme';
import {useProfile} from '../../hooks/useProfile';
import {goalBelowHealthyBmi} from '../../lib/onboardingMath';
import {normalizeWeightKg, validateWeightKg} from '../../lib/weights';
import {authErrorMessage} from '../../lib/authErrors';
import type {ProgressStackParamList} from '../../navigation/ProgressStack';

type Props = NativeStackScreenProps<ProgressStackParamList, 'EditTargets'>;

const INVALID = "That doesn't look right. Mind checking?";
const LOW_KCAL =
  "Below about 1,200 a day is hard to do safely without a doctor's guidance. Consider setting this higher for now.";
const BMI_NOTE =
  "That goal is lower than what's usually considered a healthy weight for your height. Worth talking through with a doctor before you aim for it.";

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function EditTargetsScreen({navigation}: Props) {
  const {profile, updateProfile} = useProfile();

  const [name, setName] = useState(profile?.name ?? '');
  const [kcalText, setKcalText] = useState(
    profile?.dailyKcalTarget != null ? String(profile.dailyKcalTarget) : '',
  );
  const [goalText, setGoalText] = useState(
    profile?.goalWeightKg != null ? String(profile.goalWeightKg) : '',
  );
  const [goalError, setGoalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const kcalNum = parseNumber(kcalText);
  const goalNum = parseNumber(goalText);

  const showLowKcal =
    kcalNum != null && kcalNum > 0 && kcalNum < 1200;

  const showBmiNote = useMemo(() => {
    if (goalNum == null || !validateWeightKg(goalNum)) {
      return false;
    }
    const height = profile?.heightCm;
    if (height == null) {
      return false;
    }
    return goalBelowHealthyBmi(normalizeWeightKg(goalNum), height);
  }, [goalNum, profile?.heightCm]);

  const onSave = async () => {
    setError('');
    setGoalError('');

    const trimmedName = name.trim().slice(0, 40);
    if (!trimmedName) {
      setError('Add a name to continue.');
      return;
    }

    if (kcalNum == null || kcalNum <= 0) {
      setError(INVALID);
      return;
    }

    if (goalNum == null || !validateWeightKg(goalNum)) {
      setGoalError(INVALID);
      return;
    }

    setLoading(true);
    try {
      // One profile update — historical meal entries keep their stored kcal.
      await updateProfile({
        name: trimmedName,
        dailyKcalTarget: Math.round(kcalNum),
        goalWeightKg: normalizeWeightKg(goalNum),
      });
      navigation.goBack();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.plum} strokeWidth={1.8} />
        </Pressable>
        <Text variant="h3" color="plum" style={styles.headerTitle}>
          Edit targets
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <Input
          label="Name"
          value={name}
          onChangeText={t => setName(t.slice(0, 40))}
          maxLength={40}
          autoCapitalize="words"
        />

        <View style={styles.field}>
          <Input
            label="Daily calorie target"
            value={kcalText}
            onChangeText={setKcalText}
            keyboardType="number-pad"
            suffix="kcal"
          />
          {showLowKcal ? (
            <Text variant="caption" color="clay" style={styles.note}>
              {LOW_KCAL}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Input
            label="Goal weight"
            value={goalText}
            onChangeText={t => {
              setGoalText(t);
              setGoalError('');
            }}
            keyboardType="decimal-pad"
            suffix="kg"
            error={goalError}
          />
          {showBmiNote ? (
            <Text variant="caption" color="clay" style={styles.note}>
              {BMI_NOTE}
            </Text>
          ) : null}
        </View>

        {error ? (
          <Text variant="caption" color="clay" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Save changes"
          onPress={onSave}
          loading={loading}
          style={styles.save}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.papaya},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {width: 22},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  field: {
    marginTop: spacing.lg,
  },
  note: {
    marginTop: spacing.sm,
  },
  error: {
    marginTop: spacing.md,
  },
  save: {
    marginTop: spacing.xl,
  },
});
