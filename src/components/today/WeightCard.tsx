import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, spacing, radius} from '../../theme';
import {Text} from '../Text';
import {Button} from '../Button';
import {
  daysBetween,
  formatWeightRelative,
  isoWeekKey,
  localDateKey,
} from '../../lib/dates';
import type {WeightEntry} from '../../lib/weights';

type Props = {
  latestWeight: WeightEntry | null;
  startWeightKg: number | null;
  goalWeightKg: number | null;
  loading?: boolean;
  onLogWeight: () => void;
};

const NUDGE_PREFIX = 'kin:weightNudgeWeek:';

export function WeightCard({
  latestWeight,
  startWeightKg,
  goalWeightKg,
  loading,
  onLogWeight,
}: Props) {
  const [showNudge, setShowNudge] = useState(false);
  const today = localDateKey();
  const kg = latestWeight?.kg ?? startWeightKg;

  const delta =
    latestWeight != null && startWeightKg != null
      ? Math.round((latestWeight.kg - startWeightKg) * 10) / 10
      : null;

  // Seed-only / unchanged: hide the figure. Spec never wants a verdict for zero.
  const showDelta = delta != null && delta !== 0;

  let deltaColor: 'moss' | 'warmGray' = 'warmGray';
  if (showDelta && goalWeightKg != null && startWeightKg != null) {
    const goalDir = Math.sign(goalWeightKg - startWeightKg);
    const moveDir = Math.sign(delta!);
    if (goalDir !== 0 && moveDir === goalDir) {
      deltaColor = 'moss';
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function checkNudge() {
      if (!latestWeight) {
        setShowNudge(false);
        return;
      }
      const age = daysBetween(latestWeight.date, today);
      if (age < 7) {
        setShowNudge(false);
        return;
      }
      const key = `${NUDGE_PREFIX}${isoWeekKey()}`;
      try {
        const seen = await AsyncStorage.getItem(key);
        if (cancelled) {
          return;
        }
        if (seen) {
          setShowNudge(false);
          return;
        }
        setShowNudge(true);
        await AsyncStorage.setItem(key, '1');
      } catch {
        if (!cancelled) {
          setShowNudge(true);
        }
      }
    }
    checkNudge();
    return () => {
      cancelled = true;
    };
  }, [latestWeight, today]);

  const relative = latestWeight
    ? formatWeightRelative(latestWeight.date, today)
    : null;

  return (
    <View style={styles.card}>
      <Text variant="eyebrow" color="warmGray">
        Weight
      </Text>
      <View style={styles.row}>
        <View style={styles.left}>
          {loading || kg == null ? (
            <View style={styles.skel} />
          ) : (
            <View style={styles.kgRow}>
              <Text variant="h2" color="plum" style={styles.kg}>
                {kg.toLocaleString(undefined, {
                  minimumFractionDigits: kg % 1 === 0 ? 0 : 1,
                  maximumFractionDigits: 1,
                })}
              </Text>
              <Text variant="caption" color="warmGray" style={styles.unit}>
                kg
              </Text>
            </View>
          )}
          {relative ? (
            <Text variant="caption" color="warmGray">
              Logged {relative}
            </Text>
          ) : null}
        </View>
        {showDelta ? (
          <Text variant="h3" color={deltaColor} style={styles.delta}>
            {delta! > 0 ? '+' : ''}
            {delta!.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{' '}
            kg
          </Text>
        ) : null}
      </View>
      {showNudge ? (
        <Text variant="caption" color="warmGray" style={styles.nudge}>
          It's been a while. A fresh number when you're ready.
        </Text>
      ) : null}
      <Button
        label="Log weight"
        variant="ghost"
        size="small"
        onPress={onLogWeight}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  left: {
    flex: 1,
  },
  kgRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  kg: {
    fontVariant: ['tabular-nums'],
  },
  unit: {
    marginBottom: 2,
  },
  delta: {
    fontVariant: ['tabular-nums'],
  },
  nudge: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  skel: {
    width: 72,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.hairline,
    marginBottom: spacing.xs,
  },
});
