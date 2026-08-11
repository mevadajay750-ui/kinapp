import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../theme';
import {TodayHomeScreen} from '../screens/today/TodayHomeScreen';
import {LogWeightScreen} from '../screens/today/LogWeightScreen';

export type TodayStackParamList = {
  TodayHome: undefined;
  LogWeight: undefined;
};

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayStack() {
  return (
    <Stack.Navigator
      initialRouteName="TodayHome"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.papaya},
      }}>
      <Stack.Screen name="TodayHome" component={TodayHomeScreen} />
      <Stack.Screen
        name="LogWeight"
        component={LogWeightScreen}
        options={{presentation: 'modal'}}
      />
    </Stack.Navigator>
  );
}
