import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OnboardingLayout} from '../../components/onboarding/OnboardingLayout';
import {Input} from '../../components/Input';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {useOnboardingDraft} from '../../hooks/useOnboardingDraft';
import {suggestDailyKcal} from '../../lib/onboardingMath';
import {OnboardingStackParamList} from '../../navigation/OnboardingStack';
import {colors, radius, spacing} from '../../theme';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Target'>;

const CHIPS = [1400, 1500, 1600, 1700, 1800, 2000] as const;

function parseNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function TargetScreen() {
  const navigation = useNavigation<Nav>();
  const {draft, setDraft} = useOnboardingDraft();

  const weight = parseNumber(draft.startWeightKg) ?? 70;
  const heightRaw = parseNumber(draft.heightCm);
  const heightCm =
    draft.heightCm.trim() === '' || heightRaw == null ? null : heightRaw;

  const suggested = useMemo(
    () => suggestDailyKcal(weight, heightCm),
    [weight, heightCm],
  );

  const suggestedIsChip = (CHIPS as readonly number[]).includes(suggested);

  const [customOpen, setCustomOpen] = useState(!suggestedIsChip);
  const [customValue, setCustomValue] = useState(
    suggestedIsChip ? '' : String(suggested),
  );
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) {
      return;
    }
    if (draft.dailyKcalTarget != null) {
      const existing = draft.dailyKcalTarget;
      if ((CHIPS as readonly number[]).includes(existing)) {
        setCustomOpen(false);
      } else {
        setCustomOpen(true);
        setCustomValue(String(existing));
      }
    } else {
      setDraft({dailyKcalTarget: suggested});
      if (!suggestedIsChip) {
        setCustomOpen(true);
        setCustomValue(String(suggested));
      }
    }
    setInitialized(true);
  }, [
    draft.dailyKcalTarget,
    initialized,
    setDraft,
    suggested,
    suggestedIsChip,
  ]);

  const selected = draft.dailyKcalTarget;
  const customNum = parseNumber(customValue);
  const showLowNote =
    customOpen && customNum != null && customNum > 0 && customNum < 1200;

  const onSelectChip = (kcal: number) => {
    setCustomOpen(false);
    setDraft({dailyKcalTarget: kcal});
  };

  const onOpenCustom = () => {
    setCustomOpen(true);
    const seed =
      selected != null && !(CHIPS as readonly number[]).includes(selected)
        ? String(selected)
        : customValue || String(suggested);
    setCustomValue(seed);
    const n = parseNumber(seed);
    if (n != null) {
      setDraft({dailyKcalTarget: n});
    }
  };

  const onCustomChange = (text: string) => {
    setCustomValue(text);
    const n = parseNumber(text);
    if (n != null) {
      setDraft({dailyKcalTarget: n});
    }
  };

  const canContinue = selected != null && selected > 0;

  return (
    <OnboardingLayout
      step={3}
      eyebrow="Daily plate"
      title="A number to aim at."
      body="This is a reference point, not a rule. Pick something you could keep up for months, not days."
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Continue"
          onPress={() => navigation.navigate('Ready')}
          disabled={!canContinue}
        />
      }>
      <View style={styles.grid}>
        {CHIPS.map(kcal => {
          const isSelected = !customOpen && selected === kcal;
          const isSuggested = suggested === kcal;
          return (
            <Pressable
              key={kcal}
              onPress={() => onSelectChip(kcal)}
              accessibilityRole="button"
              accessibilityState={{selected: isSelected}}
              accessibilityHint={isSuggested ? 'Suggested' : undefined}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipIdle,
              ]}>
              {isSuggested ? <View style={styles.suggestedDot} /> : null}
              <Text
                variant="h3"
                color={isSelected ? 'papaya' : 'plum'}
                style={styles.tabular}>
                {kcal.toLocaleString()}
              </Text>
              <Text
                variant="caption"
                color={isSelected ? 'papaya' : 'warmGray'}>
                kcal
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={onOpenCustom} hitSlop={8} style={styles.customLink}>
        <Text variant="small" color="warmGray">
          Set my own number
        </Text>
      </Pressable>

      {customOpen ? (
        <View style={styles.customField}>
          <Input
            label="Daily target"
            value={customValue}
            onChangeText={onCustomChange}
            keyboardType="number-pad"
            suffix="kcal"
            style={styles.tabular}
          />
          {suggested === (customNum ?? -1) && !suggestedIsChip ? (
            <View style={styles.customSuggestedRow}>
              <View style={styles.suggestedDotInline} />
              <Text variant="caption" color="warmGray">
                Suggested
              </Text>
            </View>
          ) : null}
          {showLowNote ? (
            <Text variant="caption" color="clay" style={styles.note}>
              Below about 1,200 a day is hard to do safely without a doctor's
              guidance. Consider setting this higher for now.
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text variant="caption" color="warmGray" style={styles.closing}>
        Not sure? 1,600 is a common starting point. You can change this any time
        in Progress.
      </Text>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chip: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chipIdle: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipSelected: {
    backgroundColor: colors.plum,
    borderWidth: 1,
    borderColor: colors.plum,
  },
  suggestedDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.marigold,
  },
  customLink: {
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
  },
  customField: {
    marginTop: spacing.lg,
  },
  customSuggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  suggestedDotInline: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.marigold,
  },
  note: {
    marginTop: spacing.sm,
  },
  closing: {
    marginTop: spacing.xxl,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
