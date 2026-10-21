import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from './src/context/ProfileContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ProfileProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </ProfileProvider>
  );
}
