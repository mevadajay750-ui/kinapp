import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {WelcomeScreen} from '../screens/onboarding/WelcomeScreen';
import {WeightScreen} from '../screens/onboarding/WeightScreen';
import {TargetScreen} from '../screens/onboarding/TargetScreen';
import {ReadyScreen} from '../screens/onboarding/ReadyScreen';
import {colors} from '../theme';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Weight: undefined;
  Target: undefined;
  Ready: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: {backgroundColor: colors.papaya},
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Weight" component={WeightScreen} />
      <Stack.Screen name="Target" component={TargetScreen} />
      <Stack.Screen name="Ready" component={ReadyScreen} />
    </Stack.Navigator>
  );
}
