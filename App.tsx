import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthProvider';
import {RootNavigator} from './src/navigation/RootNavigator';
import {colors} from './src/theme';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.papaya} />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
