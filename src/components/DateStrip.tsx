import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import {colors, spacing} from '../theme';
import {Text} from './Text';
import {
  localDateKey,
  addDays,
  isToday,
  formatDateLabel,
} from '../lib/dates';

type Props = {
  dateKey: string;
  onChange: (next: string) => void;
};

export function DateStrip({dateKey, onChange}: Props) {
  const today = isToday(dateKey);

  return (
    <View style={styles.dateStrip}>
      <Pressable
        onPress={() => onChange(addDays(dateKey, -1))}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Previous day">
        <ChevronLeft size={22} color={colors.plum} strokeWidth={1.8} />
      </Pressable>
      <View style={styles.dateCenter}>
        <Text variant="h2" color="plum" style={styles.dateLabel}>
          {formatDateLabel(dateKey)}
        </Text>
        {!today ? (
          <Pressable
            onPress={() => onChange(localDateKey())}
            hitSlop={8}
            accessibilityRole="button">
            <Text variant="small" color="marigold">
              Back to today
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={() => {
          if (!today) {
            onChange(addDays(dateKey, 1));
          }
        }}
        disabled={today}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Next day"
        style={{opacity: today ? 0.35 : 1}}>
        <ChevronRight size={22} color={colors.plum} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  dateCenter: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateLabel: {
    textAlign: 'center',
  },
});
