import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from './src/context/ProfileContext';
import { PresenceProvider } from './src/presence/PresenceContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ProfileProvider>
      <PresenceProvider>
        <StatusBar style="dark" />
        {/* Gen‑Z light gradient UI; presence + profile providers unchanged */}
        <RootNavigator />
      </PresenceProvider>
    </ProfileProvider>
  );
}
