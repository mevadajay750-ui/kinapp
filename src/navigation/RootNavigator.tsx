import React from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {useAuth} from '../hooks/useAuth';
import {AuthStack} from './AuthStack';
import {TabNavigator} from './TabNavigator';
import {colors} from '../theme';

export function RootNavigator() {
  const {user, initializing} = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.plum} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <TabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.papaya,
  },
});
