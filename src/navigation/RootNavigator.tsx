import React from 'react';
import {View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {useAuth} from '../hooks/useAuth';
import {useProfile} from '../hooks/useProfile';
import {AuthStack} from './AuthStack';
import {OnboardingStack} from './OnboardingStack';
import {TabNavigator} from './TabNavigator';
import {OnboardingDraftProvider} from '../context/OnboardingDraftProvider';
import {KinLogo} from '../components/KinLogo';
import {colors} from '../theme';

export function RootNavigator() {
  const {user, initializing} = useAuth();
  const {profile, loading: profileLoading} = useProfile();

  if (initializing || (user != null && profileLoading)) {
    return (
      <View style={styles.splash}>
        <KinLogo size={72} />
      </View>
    );
  }

  let content: React.ReactNode;
  if (!user) {
    content = <AuthStack />;
  } else if (!profile?.onboardingComplete) {
    content = (
      <OnboardingDraftProvider>
        <OnboardingStack />
      </OnboardingDraftProvider>
    );
  } else {
    content = <TabNavigator />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.papaya,
  },
});
