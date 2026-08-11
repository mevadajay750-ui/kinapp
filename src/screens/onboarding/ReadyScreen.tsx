import React, {useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingLayout} from '../../components/onboarding/OnboardingLayout';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {useOnboardingDraft} from '../../hooks/useOnboardingDraft';
import {useProfile} from '../../hooks/useProfile';
import {OnboardingStackParamList} from '../../navigation/OnboardingStack';
import {colors, radius, spacing} from '../../theme';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Ready'>;

function parseNumber(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

export function ReadyScreen() {
  const navigation = useNavigation<Nav>();
  const {draft} = useOnboardingDraft();
  const {completeOnboarding} = useProfile();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const current = parseNumber(draft.startWeightKg);
  const goal = parseNumber(draft.goalWeightKg);
  const heightRaw = draft.heightCm.trim();
  const heightCm = heightRaw === '' ? null : parseNumber(draft.heightCm);
  const target = draft.dailyKcalTarget ?? 1600;

  let body: string;
  if (goal < current) {
    body = `From ${formatNum(current)} kg toward ${formatNum(goal)} kg, at about ${formatNum(target)} kcal a day. Steady beats fast.`;
  } else if (goal > current) {
    body = `From ${formatNum(current)} kg toward ${formatNum(goal)} kg, at about ${formatNum(target)} kcal a day. Steady beats fast.`;
  } else {
    body = `Holding steady around ${formatNum(current)} kg, at about ${formatNum(target)} kcal a day.`;
  }

  const onStart = async () => {
    setFormError('');
    setLoading(true);
    try {
      await completeOnboarding({
        name: draft.name.trim() || 'Friend',
        startWeightKg: current,
        goalWeightKg: goal,
        heightCm,
        dailyKcalTarget: target,
      });
      // RootNavigator swaps to tabs when onboardingComplete flips via snapshot.
    } catch {
      setFormError(
        "Couldn't save that. Check your connection and try again.",
      );
      setLoading(false);
    }
  };

  const rows = [
    {label: 'Starting weight', value: `${formatNum(current)} kg`},
    {label: 'Goal weight', value: `${formatNum(goal)} kg`},
    {label: 'Daily target', value: `${formatNum(target)} kcal`},
  ];

  return (
    <OnboardingLayout
      step={4}
      eyebrow="All set"
      title="That's everything."
      body={body}
      onBack={() => navigation.goBack()}
      footer={
        <View style={styles.footerBlock}>
          {formError ? (
            <Text variant="caption" color="clay" style={styles.error}>
              {formError}
            </Text>
          ) : null}
          <Button
            label="Start tracking"
            onPress={onStart}
            loading={loading}
          />
        </View>
      }>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={row.label}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.row}>
              <Text variant="caption" color="warmGray">
                {row.label}
              </Text>
              <Text variant="h3" color="plum" style={styles.value}>
                {row.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={8}
        style={styles.changeLink}>
        <Text variant="small" color="warmGray">
          Change something
        </Text>
      </Pressable>

      <Text variant="caption" color="warmGray" style={styles.disclaimer}>
        Kin is a journal, not medical advice. For concerns specific to you, a
        doctor or dietitian is the right place.
      </Text>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  changeLink: {
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
  },
  disclaimer: {
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  footerBlock: {
    gap: spacing.md,
  },
  error: {
    textAlign: 'center',
  },
});
