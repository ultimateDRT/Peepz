import {
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useProfile } from '../context/ProfileContext';
import { CreatePeepScreen } from '../screens/CreatePeepScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { colors } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.surfaceBorder,
    primary: colors.electricPurple,
  },
};

export function RootNavigator() {
  const { profile, bootstrapping } = useProfile();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const hadProfile = useRef(Boolean(profile));

  useEffect(() => {
    if (bootstrapping || !navigationRef.isReady()) return;

    // Settings → Reset clears storage; leave MainTabs and return to Welcome.
    if (!profile && hadProfile.current) {
      hadProfile.current = false;
      navigationRef.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      return;
    }

    if (profile) {
      hadProfile.current = true;
    }
  }, [profile, bootstrapping, navigationRef]);

  if (bootstrapping) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.electricPurple} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName={profile ? 'MainTabs' : 'Welcome'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen
          name="CreatePeep"
          component={CreatePeepScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
