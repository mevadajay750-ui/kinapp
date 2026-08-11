import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigatorScreenParams} from '@react-navigation/native';
import {Home, UtensilsCrossed, ListChecks, TrendingUp} from 'lucide-react-native';
import {colors} from '../theme';
import {TodayStack, TodayStackParamList} from './TodayStack';
import {MealsStack} from './MealsStack';
import {HabitsStack} from './HabitsStack';
import {ProgressStack} from './ProgressStack';

export type TabParamList = {
  Today: NavigatorScreenParams<TodayStackParamList> | undefined;
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
        component={TodayStack}
        options={{
          tabBarIcon: ({color, size}) => (
            <Home color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsStack}
        options={{
          tabBarIcon: ({color, size}) => (
            <UtensilsCrossed color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Habits"
        component={HabitsStack}
        options={{
          tabBarIcon: ({color, size}) => (
            <ListChecks color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressStack}
        options={{
          tabBarIcon: ({color, size}) => (
            <TrendingUp color={color} size={size - 2} strokeWidth={1.8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
