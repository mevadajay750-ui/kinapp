import React, {useState} from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ArrowLeft} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from '../../components/Text';
import {Input} from '../../components/Input';
import {Button} from '../../components/Button';
import {colors, spacing} from '../../theme';
import {useAuth} from '../../hooks/useAuth';
import {addMealEntry} from '../../lib/meals';
import type {MealsStackParamList} from '../../navigation/MealsStack';

type Props = NativeStackScreenProps<MealsStackParamList, 'CustomFood'>;

const VALIDATION = "That doesn't look right. Mind checking?";

function categoryLabel(category: string): string {
  if (category === 'snack') {
    return 'snacks';
  }
  return category;
}

export function CustomFoodScreen({navigation, route}: Props) {
  const {category, dateKey} = route.params;
  const {user} = useAuth();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [serving, setServing] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [kcalError, setKcalError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmedName = name.trim();
    const kcalNum = Number(kcal.replace(/,/g, ''));
    let ok = true;

    if (!trimmedName) {
      setNameError(VALIDATION);
      ok = false;
    } else {
      setNameError(undefined);
    }

    if (!Number.isFinite(kcalNum) || kcalNum <= 0 || kcalNum >= 5000) {
      setKcalError(VALIDATION);
      ok = false;
    } else {
      setKcalError(undefined);
    }

    if (!ok || !user) {
      return;
    }

    const proteinNum = protein.trim()
      ? Number(protein.replace(/,/g, ''))
      : 0;
    const proteinG =
      Number.isFinite(proteinNum) && proteinNum >= 0 ? proteinNum : 0;

    setLoading(true);
    try {
      await addMealEntry(user.uid, {
        date: dateKey,
        category,
        foodId: null,
        name: trimmedName,
        serving: serving.trim() || '1 serving',
        portions: 1,
        kcal: Math.round(kcalNum),
        proteinG,
      });
      navigation.pop(2);
    } catch (e) {
      console.warn('[kin] custom addMealEntry failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
          <Text variant="h3" color="plum" style={styles.title}>
            Add your own
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled">
          <Text variant="body" color="warmGray" style={styles.intro}>
            For home cooking and anything we don't have yet.
          </Text>

          <Input
            label="Name"
            value={name}
            onChangeText={t => {
              setName(t);
              if (nameError) {
                setNameError(undefined);
              }
            }}
            error={nameError}
            autoCapitalize="sentences"
          />
          <Input
            label="Calories"
            value={kcal}
            onChangeText={t => {
              setKcal(t);
              if (kcalError) {
                setKcalError(undefined);
              }
            }}
            error={kcalError}
            keyboardType="decimal-pad"
            suffix="kcal"
          />
          <Input
            label="Protein"
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            suffix="g"
          />
          <Input
            label="Serving description"
            value={serving}
            onChangeText={setServing}
            placeholder="1 bowl"
          />

          <Button
            label={`Add to ${categoryLabel(category)}`}
            onPress={() => void onSubmit()}
            loading={loading}
            style={styles.cta}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.papaya,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
  headerSpacer: {
    width: 22,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  intro: {
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.md,
  },
});
