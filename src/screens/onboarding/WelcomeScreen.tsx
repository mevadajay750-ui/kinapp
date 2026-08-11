import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ListChecks, TrendingUp, UtensilsCrossed} from 'lucide-react-native';
import {OnboardingLayout} from '../../components/onboarding/OnboardingLayout';
import {KinLogo} from '../../components/KinLogo';
import {Text} from '../../components/Text';
import {Button} from '../../components/Button';
import {useAuth} from '../../hooks/useAuth';
import {useOnboardingDraft} from '../../hooks/useOnboardingDraft';
import {OnboardingStackParamList} from '../../navigation/OnboardingStack';
import {colors, spacing} from '../../theme';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const FEATURES = [
  {
    Icon: UtensilsCrossed,
    label: 'A vegetarian meal log, built for Indian food',
  },
  {
    Icon: ListChecks,
    label: 'Habits you choose, not ones we assign',
  },
  {
    Icon: TrendingUp,
    label: 'Progress measured in weeks, not hours',
  },
] as const;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const {user} = useAuth();
  const {setDraft} = useOnboardingDraft();

  useEffect(() => {
    if (user?.displayName) {
      setDraft({name: user.displayName});
    }
  }, [user?.displayName, setDraft]);

  return (
    <OnboardingLayout
      step={1}
      eyebrow="Welcome"
      title="Small changes, kept every day."
      body="Kin is a quiet place to notice what you eat, how you move, and how you sleep. Four short questions and we're done."
      leading={<KinLogo size={64} />}
      footer={
        <Button
          label="Let's begin"
          onPress={() => navigation.navigate('Weight')}
        />
      }>
      <View style={styles.list}>
        {FEATURES.map(({Icon, label}) => (
          <View key={label} style={styles.row}>
            <View style={styles.iconCircle}>
              <Icon size={16} color={colors.plum} />
            </View>
            <Text variant="body" color="plum" style={styles.rowLabel}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
  },
});
