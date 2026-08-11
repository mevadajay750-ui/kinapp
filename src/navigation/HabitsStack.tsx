import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../theme';
import {HabitsDayScreen} from '../screens/habits/HabitsDayScreen';
import {EditHabitScreen} from '../screens/habits/EditHabitScreen';
import {ManageHabitsScreen} from '../screens/habits/ManageHabitsScreen';

export type HabitsStackParamList = {
  HabitsDay: undefined;
  EditHabit: {habitId?: string};
  ManageHabits: undefined;
};

const Stack = createNativeStackNavigator<HabitsStackParamList>();

export function HabitsStack() {
  return (
    <Stack.Navigator
      initialRouteName="HabitsDay"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.papaya},
      }}>
      <Stack.Screen name="HabitsDay" component={HabitsDayScreen} />
      <Stack.Screen name="EditHabit" component={EditHabitScreen} />
      <Stack.Screen name="ManageHabits" component={ManageHabitsScreen} />
    </Stack.Navigator>
  );
}
