import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../theme';
import {ProgressHomeScreen} from '../screens/progress/ProgressHomeScreen';
import {SettingsScreen} from '../screens/progress/SettingsScreen';
import {EditTargetsScreen} from '../screens/progress/EditTargetsScreen';

export type ProgressStackParamList = {
  ProgressHome: undefined;
  Settings: undefined;
  EditTargets: undefined;
};

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressStack() {
  return (
    <Stack.Navigator
      initialRouteName="ProgressHome"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.papaya},
      }}>
      <Stack.Screen name="ProgressHome" component={ProgressHomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditTargets" component={EditTargetsScreen} />
    </Stack.Navigator>
  );
}
