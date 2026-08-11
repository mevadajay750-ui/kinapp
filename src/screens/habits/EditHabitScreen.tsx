import React, {useEffect, useState} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ArrowLeft} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {Input} from '../../components/Input';
import {Button} from '../../components/Button';
import {ConfirmSheet} from '../../components/meals/ConfirmSheet';
import {
  HABIT_ICON_NAMES,
  getHabitIcon,
} from '../../components/habits/habitIcons';
import {colors, spacing, radius} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {
  HabitKind,
  archiveHabit,
  createHabit,
  getHabit,
  updateHabit,
} from '../../lib/habits';
import type {HabitsStackParamList} from '../../navigation/HabitsStack';

type Props = NativeStackScreenProps<HabitsStackParamList, 'EditHabit'>;

const KINDS: {key: HabitKind; label: string; hint: string}[] = [
  {key: 'binary', label: 'Just do it', hint: 'A simple tick each day.'},
  {
    key: 'count',
    label: 'Count them',
    hint: 'Tap to add one at a time, toward a daily target.',
  },
  {
    key: 'amount',
    label: 'Log a number',
    hint: 'Enter a value each day, like hours slept.',
  },
];

export function EditHabitScreen({navigation, route}: Props) {
  const habitId = route.params?.habitId;
  const isEdit = !!habitId;
  const {user} = useAuth();

  const [name, setName] = useState('');
  const [kind, setKind] = useState<HabitKind>('binary');
  const [targetText, setTargetText] = useState('');
  const [unit, setUnit] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [habitName, setHabitName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHabit, setLoadingHabit] = useState(isEdit);
  const [error, setError] = useState<string | undefined>();
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (!user || !habitId) {
      return;
    }
    let cancelled = false;
    getHabit(user.uid, habitId)
      .then(habit => {
        if (cancelled || !habit) {
          return;
        }
        setName(habit.name);
        setHabitName(habit.name);
        setKind(habit.kind);
        setIcon(habit.icon);
        setTargetText(habit.target != null ? String(habit.target) : '');
        setUnit(habit.unit ?? '');
      })
      .catch(e => console.warn('[kin] getHabit failed', e))
      .finally(() => {
        if (!cancelled) {
          setLoadingHabit(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, habitId]);

  const kindMeta = KINDS.find(k => k.key === kind)!;
  const needsTarget = kind === 'count' || kind === 'amount';

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give this habit a name.');
      return;
    }
    if (trimmed.length > 40) {
      setError('Keep the name under 40 characters.');
      return;
    }

    let target: number | null = null;
    let unitValue: string | null = null;

    if (needsTarget) {
      const n = Number(targetText);
      if (kind === 'count') {
        if (!Number.isInteger(n) || n < 1 || n > 50) {
          setError('Pick a whole number between 1 and 50.');
          return;
        }
        target = n;
      } else {
        if (!Number.isFinite(n) || n < 0.5 || n > 24) {
          setError('Pick a number between 0.5 and 24.');
          return;
        }
        target = Math.round(n * 10) / 10;
      }
      unitValue = unit.trim().slice(0, 12) || null;
      if (!unitValue) {
        setError(kind === 'count' ? 'Add a unit, like glasses.' : 'Add a unit, like hours.');
        return;
      }
    }

    if (!user) {
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      if (isEdit && habitId) {
        await updateHabit(user.uid, habitId, {
          name: trimmed,
          kind,
          icon,
          target,
          unit: unitValue,
        });
      } else {
        await createHabit(user.uid, {
          name: trimmed,
          kind,
          icon,
          target,
          unit: unitValue,
        });
      }
      navigation.goBack();
    } catch (e) {
      console.warn('[kin] save habit failed', e);
      setError('Something went wrong. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const onArchive = async () => {
    if (!user || !habitId) {
      return;
    }
    setConfirmArchive(false);
    try {
      await archiveHabit(user.uid, habitId);
      navigation.navigate('HabitsDay');
    } catch (e) {
      console.warn('[kin] archiveHabit failed', e);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <ArrowLeft size={22} color={colors.plum} strokeWidth={1.8} />
          </Pressable>
          <Text variant="h3" color="plum">
            {isEdit ? 'Edit habit' : 'New habit'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {loadingHabit ? (
          <View style={styles.skeleton} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled">
            <Input
              label="Name"
              value={name}
              onChangeText={t => {
                setName(t.slice(0, 40));
                setError(undefined);
              }}
              placeholder="Walk after dinner"
              maxLength={40}
            />

            <Text variant="eyebrow" color="warmGray" style={styles.label}>
              Kind
            </Text>
            <View style={styles.segment}>
              {KINDS.map(k => {
                const selected = kind === k.key;
                return (
                  <Pressable
                    key={k.key}
                    onPress={() => {
                      setKind(k.key);
                      setError(undefined);
                      if (k.key === 'binary') {
                        setTargetText('');
                        setUnit('');
                      } else if (k.key === 'count' && !unit) {
                        setUnit('glasses');
                      } else if (k.key === 'amount' && !unit) {
                        setUnit('hours');
                      }
                    }}
                    style={[styles.segItem, selected && styles.segSelected]}
                    accessibilityRole="button"
                    accessibilityState={{selected}}>
                    <Text
                      variant="small"
                      color={selected ? 'papaya' : 'plum'}
                      style={styles.segLabel}>
                      {k.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text variant="caption" color="warmGray" style={styles.hint}>
              {kindMeta.hint}
            </Text>

            {needsTarget ? (
              <>
                <Input
                  label="Target"
                  value={targetText}
                  onChangeText={t => {
                    setTargetText(t);
                    setError(undefined);
                  }}
                  keyboardType="decimal-pad"
                  placeholder={kind === 'count' ? '8' : '7.5'}
                  style={styles.fieldGap}
                />
                <Input
                  label="Unit"
                  value={unit}
                  onChangeText={t => setUnit(t.slice(0, 12))}
                  placeholder={kind === 'count' ? 'glasses' : 'hours'}
                  maxLength={12}
                />
              </>
            ) : null}

            <Text variant="eyebrow" color="warmGray" style={styles.label}>
              Icon
            </Text>
            <View style={styles.iconGrid}>
              {HABIT_ICON_NAMES.map(nameKey => {
                const Icon = getHabitIcon(nameKey);
                const selected = icon === nameKey;
                return (
                  <Pressable
                    key={nameKey}
                    onPress={() => setIcon(nameKey)}
                    style={[styles.iconCell, selected && styles.iconSelected]}
                    accessibilityRole="button"
                    accessibilityState={{selected}}>
                    <Icon
                      size={20}
                      color={colors.plum}
                      strokeWidth={1.8}
                    />
                  </Pressable>
                );
              })}
            </View>

            {error ? (
              <Text variant="caption" color="clay" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Button
              label={isEdit ? 'Save changes' : 'Create habit'}
              onPress={onSave}
              loading={loading}
              style={styles.save}
            />

            {isEdit ? (
              <Button
                label="Archive this habit"
                variant="ghost"
                onPress={() => setConfirmArchive(true)}
                style={styles.archive}
              />
            ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={confirmArchive}
        title={`Archive ${habitName || 'this habit'}?`}
        body="It comes off your daily list. Your history stays — you can bring it back any time."
        confirmLabel="Archive"
        cancelLabel="Keep it"
        onConfirm={onArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerSpacer: {width: 22},
  scroll: {paddingBottom: spacing.xxxl},
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 3,
    gap: 2,
  },
  segItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segSelected: {
    backgroundColor: colors.plum,
  },
  segLabel: {
    textAlign: 'center',
  },
  hint: {
    marginTop: spacing.sm,
  },
  fieldGap: {
    marginTop: 0,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconCell: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    borderColor: colors.plum,
    borderWidth: 2,
  },
  error: {
    marginTop: spacing.md,
  },
  save: {
    marginTop: spacing.xl,
  },
  archive: {
    marginTop: spacing.sm,
  },
  skeleton: {
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.hairline,
  },
});
