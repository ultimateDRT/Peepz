import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner';
import { LinearGradientFallback } from '../components/LinearGradientFallback';
import { PeepBubble } from '../components/PeepBubble';
import { PrimaryButton } from '../components/PrimaryButton';
import { useProfile } from '../context/ProfileContext';
import type { MainScreenProps } from '../navigation/types';
import { usePresence } from '../presence/PresenceContext';
import { colors, radii, spacing, typography } from '../theme';

export function MainScreen({ navigation }: MainScreenProps) {
  const { profile, upsertProfile } = useProfile();
  const { peers } = usePresence();
  const [toggling, setToggling] = useState(false);

  if (!profile) {
    return (
      <LinearGradientFallback>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator color={colors.purpleSoft} />
          <Text style={styles.loadingText}>Loading your Peep…</Text>
          <PrimaryButton
            label="Create Your Peep"
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'Welcome' },
                  { name: 'CreatePeep', params: { mode: 'create' } },
                ],
              })
            }
            style={{
              marginTop: spacing.lg,
              alignSelf: 'stretch',
              marginHorizontal: spacing.lg,
            }}
          />
        </SafeAreaView>
      </LinearGradientFallback>
    );
  }

  const onToggleDiscoverable = async (next: boolean) => {
    setToggling(true);
    try {
      await upsertProfile({
        ...profile,
        discoverable: next,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <LinearGradientFallback>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.brand}>Peepzi</Text>
          <Text style={styles.headerSub}>Your world, nearby</Text>
        </View>

        <ConnectionStatusBanner />

        <View style={styles.camera}>
          <View style={styles.cameraFrame}>
            <Text style={styles.cameraLabel}>Camera</Text>
            <Text style={styles.cameraHint}>
              Your Peep floats above you like a chat bubble. Live AR arrives
              later — this is the Expo Go preview.
            </Text>
            <View style={styles.bubbleStage}>
              <PeepBubble profile={profile} size="lg" />
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>Discoverable</Text>
              <Text style={styles.toggleSub}>
                {profile.discoverable
                  ? 'Family peers in your private room can see you.'
                  : 'You are hidden. Toggle on only when you want to be seen.'}
              </Text>
            </View>
            {toggling ? (
              <ActivityIndicator color={colors.purpleSoft} />
            ) : (
              <Switch
                value={profile.discoverable}
                onValueChange={onToggleDiscoverable}
                trackColor={{
                  false: colors.surfaceBorder,
                  true: colors.purple,
                }}
                thumbColor={colors.backgroundElevated}
                ios_backgroundColor={colors.surfaceBorder}
                accessibilityLabel="Discoverable"
              />
            )}
          </View>

          <PrimaryButton
            label={`Discover${peers.length ? ` (${peers.length})` : ''}`}
            onPress={() => navigation.navigate('Discover')}
          />
          <PrimaryButton
            label="Edit Profile"
            variant="secondary"
            onPress={() => navigation.navigate('CreatePeep', { mode: 'edit' })}
          />
        </View>
      </SafeAreaView>
    </LinearGradientFallback>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerSub: {
    ...typography.caption,
    marginTop: 2,
  },
  camera: {
    flex: 1,
    minHeight: 240,
  },
  cameraFrame: {
    flex: 1,
    backgroundColor: colors.cameraPlaceholder,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  cameraLabel: {
    color: colors.blue,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cameraHint: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    maxWidth: 280,
  },
  bubbleStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    ...typography.bodyStrong,
  },
  toggleSub: {
    ...typography.caption,
    lineHeight: 18,
  },
});
