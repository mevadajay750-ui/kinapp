import React, {useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingLayout} from '../../components/onboarding/OnboardingLayout';
import {Input} from '../../components/Input';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {useOnboardingDraft} from '../../hooks/useOnboardingDraft';
import {goalBelowHealthyBmi} from '../../lib/onboardingMath';
import {OnboardingStackParamList} from '../../navigation/OnboardingStack';
import {spacing} from '../../theme';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Weight'>;

const INVALID = "That doesn't look right. Mind checking?";

function parsePositive(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) {
    return null;
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n;
}

export function WeightScreen() {
  const navigation = useNavigation<Nav>();
  const {draft, setDraft} = useOnboardingDraft();

  const [currentError, setCurrentError] = useState('');
  const [goalError, setGoalError] = useState('');
  const [heightError, setHeightError] = useState('');

  const current = parsePositive(draft.startWeightKg);
  const goal = parsePositive(draft.goalWeightKg);
  const height = parsePositive(draft.heightCm);

  const currentValid =
    current != null && current >= 30 && current <= 300;
  const goalValid = goal != null && goal >= 30 && goal <= 300;
  const heightValid =
    draft.heightCm.trim() === '' ||
    (height != null && height >= 100 && height <= 250);

  const canContinue = currentValid && goalValid && heightValid;

  const largeChangeNote = useMemo(() => {
    if (!currentValid || !goalValid || current == null || goal == null) {
      return false;
    }
    return current - goal > current * 0.25;
  }, [current, goal, currentValid, goalValid]);

  const healthyRangeNote = useMemo(() => {
    if (
      !goalValid ||
      goal == null ||
      height == null ||
      draft.heightCm.trim() === '' ||
      !heightValid
    ) {
      return false;
    }
    return goalBelowHealthyBmi(goal, height);
  }, [goal, height, goalValid, heightValid, draft.heightCm]);

  const validateField = (
    kind: 'current' | 'goal' | 'height',
    value: string,
  ) => {
    const n = parsePositive(value);
    if (kind === 'current') {
      if (n == null || n < 30 || n > 300) {
        setCurrentError(INVALID);
      } else {
        setCurrentError('');
      }
      return;
    }
    if (kind === 'goal') {
      if (n == null || n < 30 || n > 300) {
        setGoalError(INVALID);
      } else {
        setGoalError('');
      }
      return;
    }
    if (value.trim() === '') {
      setHeightError('');
    } else if (n == null || n < 100 || n > 250) {
      setHeightError(INVALID);
    } else {
      setHeightError('');
    }
  };

  const onContinue = () => {
    validateField('current', draft.startWeightKg);
    validateField('goal', draft.goalWeightKg);
    validateField('height', draft.heightCm);
    if (!canContinue) {
      return;
    }
    navigation.navigate('Target');
  };

  return (
    <OnboardingLayout
      step={2}
      eyebrow="About you"
      title="Two numbers."
      body="Where you are now, and where you'd like to be. Both stay private to you."
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Continue"
          onPress={onContinue}
          disabled={!canContinue}
        />
      }>
      <View style={styles.fields}>
        <Input
          label="Current weight"
          value={draft.startWeightKg}
          onChangeText={text => {
            setDraft({startWeightKg: text});
            if (currentError) {
              validateField('current', text);
            }
          }}
          keyboardType="decimal-pad"
          suffix="kg"
          error={currentError}
          style={styles.tabular}
        />
        <Input
          label="Goal weight"
          value={draft.goalWeightKg}
          onChangeText={text => {
            setDraft({goalWeightKg: text});
            if (goalError) {
              validateField('goal', text);
            }
          }}
          keyboardType="decimal-pad"
          suffix="kg"
          error={goalError}
          style={styles.tabular}
        />
        <View>
          <Input
            label="Height (optional)"
            value={draft.heightCm}
            onChangeText={text => {
              setDraft({heightCm: text});
              if (heightError) {
                validateField('height', text);
              }
            }}
            keyboardType="decimal-pad"
            suffix="cm"
            error={heightError}
            style={styles.tabular}
          />
          {!heightError ? (
            <Text variant="caption" color="warmGray" style={styles.helper}>
              Only used to suggest a starting calorie range. Skip it if you'd
              rather.
            </Text>
          ) : null}
        </View>

        {largeChangeNote ? (
          <Text variant="caption" color="warmGray">
            That's a big change to aim for all at once. You might find it
            easier to set a nearer goal first — you can always move it later.
          </Text>
        ) : null}

        {healthyRangeNote ? (
          <Text variant="caption" color="clay">
            That goal is lower than what's usually considered a healthy weight
            for your height. Worth talking through with a doctor before you aim
            for it.
          </Text>
        ) : null}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing.lg,
  },
  helper: {
    marginTop: spacing.sm,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
