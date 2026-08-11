import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Home, UtensilsCrossed, ListChecks, TrendingUp} from 'lucide-react-native';
import {colors} from '../theme';
import {TodayScreen} from '../screens/tabs/TodayScreen';
import {MealsScreen} from '../screens/tabs/MealsScreen';
import {HabitsScreen} from '../screens/tabs/HabitsScreen';
import {ProgressScreen} from '../screens/tabs/ProgressScreen';

export type TabParamList = {
  Today: undefined;
  Meals: undefined;
  Habits: undefined;
  Progress: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.plum,
        tabBarInactiveTintColor: colors.warmGray,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 11,
          letterSpacing: 0.4,
        },
      }}>
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Home color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <UtensilsCrossed color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Habits"
        component={HabitsScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <ListChecks color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <TrendingUp color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
