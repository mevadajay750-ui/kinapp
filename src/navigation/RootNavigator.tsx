import React from 'react';
import {View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {useAuth} from '../hooks/useAuth';
import {AuthStack} from './AuthStack';
import {TabNavigator} from './TabNavigator';
import {KinLogo} from '../components/KinLogo';
import {colors} from '../theme';

export function RootNavigator() {
  const {user, initializing} = useAuth();

  if (initializing) {
    return (
      <View style={styles.splash}>
        <KinLogo size={72} />
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
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.papaya,
  },
});
