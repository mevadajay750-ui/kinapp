import React, {useEffect, useState} from 'react';
import {View, Pressable, StyleSheet, ScrollView} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from 'lucide-react-native';
import {Screen} from '../../components/Screen';
import {Text} from '../../components/Text';
import {colors, spacing, radius} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {
  Habit,
  reorderHabits,
  subscribeToArchivedHabits,
  subscribeToHabits,
  updateHabit,
} from '../../lib/habits';
import type {HabitsStackParamList} from '../../navigation/HabitsStack';

type Props = NativeStackScreenProps<HabitsStackParamList, 'ManageHabits'>;

export function ManageHabitsScreen({navigation}: Props) {
  const {user} = useAuth();
  const [active, setActive] = useState<Habit[]>([]);
  const [archived, setArchived] = useState<Habit[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    const unsubActive = subscribeToHabits(user.uid, setActive);
    const unsubArchived = subscribeToArchivedHabits(user.uid, setArchived);
    return () => {
      unsubActive();
      unsubArchived();
    };
  }, [user]);

  const move = async (index: number, direction: -1 | 1) => {
    if (!user || busy) {
      return;
    }
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= active.length) {
      return;
    }
    const next = [...active];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setActive(next);
    setBusy(true);
    try {
      await reorderHabits(
        user.uid,
        next.map(h => h.id),
      );
    } catch (e) {
      console.warn('[kin] reorderHabits failed', e);
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async (habit: Habit) => {
    if (!user || busy) {
      return;
    }
    setBusy(true);
    try {
      const order =
        active.length > 0
          ? Math.max(...active.map(h => h.order)) + 1
          : 0;
      await updateHabit(user.uid, habit.id, {archived: false, order});
    } catch (e) {
      console.warn('[kin] restore habit failed', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <ArrowLeft size={22} color={colors.plum} strokeWidth={1.8} />
        </Pressable>
        <Text variant="h3" color="plum">
          Manage habits
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <Text variant="eyebrow" color="warmGray" style={styles.section}>
          Active
        </Text>
        {active.length === 0 ? (
          <Text variant="body" color="warmGray">
            No active habits.
          </Text>
        ) : (
          active.map((habit, index) => (
            <View key={habit.id} style={styles.row}>
              <View style={styles.reorder}>
                <Pressable
                  onPress={() => move(index, -1)}
                  disabled={index === 0 || busy}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Move up"
                  style={{opacity: index === 0 ? 0.3 : 1}}>
                  <ChevronUp size={18} color={colors.warmGray} strokeWidth={1.8} />
                </Pressable>
                <Pressable
                  onPress={() => move(index, 1)}
                  disabled={index === active.length - 1 || busy}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Move down"
                  style={{
                    opacity: index === active.length - 1 ? 0.3 : 1,
                  }}>
                  <ChevronDown
                    size={18}
                    color={colors.warmGray}
                    strokeWidth={1.8}
                  />
                </Pressable>
              </View>
              <Pressable
                style={styles.rowMain}
                onPress={() =>
                  navigation.navigate('EditHabit', {habitId: habit.id})
                }
                accessibilityRole="button">
                <Text variant="bodyMedium" color="plum" style={styles.name}>
                  {habit.name}
                </Text>
                <ChevronRight size={18} color={colors.warmGray} strokeWidth={1.8} />
              </Pressable>
            </View>
          ))
        )}

        {archived.length > 0 ? (
          <>
            <Text
              variant="eyebrow"
              color="warmGray"
              style={[styles.section, styles.archivedSection]}>
              Archived
            </Text>
            {archived.map(habit => (
              <View key={habit.id} style={styles.archivedRow}>
                <Text variant="body" color="warmGray" style={styles.name}>
                  {habit.name}
                </Text>
                <Pressable
                  onPress={() => onRestore(habit)}
                  disabled={busy}
                  hitSlop={8}
                  accessibilityRole="button">
                  <Text variant="bodyMedium" color="marigold">
                    Restore
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerSpacer: {width: 22},
  scroll: {paddingBottom: spacing.xxxl},
  section: {
    marginBottom: spacing.md,
  },
  archivedSection: {
    marginTop: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  reorder: {
    alignItems: 'center',
    gap: 2,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
  },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    gap: spacing.md,
  },
});
