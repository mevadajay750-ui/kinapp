import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../theme';
import type {MealCategory} from '../data/foods';
import {MealsDayScreen} from '../screens/meals/MealsDayScreen';
import {AddFoodScreen} from '../screens/meals/AddFoodScreen';
import {CustomFoodScreen} from '../screens/meals/CustomFoodScreen';

export type MealsStackParamList = {
  MealsDay: undefined;
  AddFood: {category: MealCategory; dateKey: string};
  CustomFood: {category: MealCategory; dateKey: string};
};

const Stack = createNativeStackNavigator<MealsStackParamList>();

export function MealsStack() {
  return (
    <Stack.Navigator
      initialRouteName="MealsDay"
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.papaya},
      }}>
      <Stack.Screen name="MealsDay" component={MealsDayScreen} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} />
      <Stack.Screen name="CustomFood" component={CustomFoodScreen} />
    </Stack.Navigator>
  );
}
