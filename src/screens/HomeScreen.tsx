import { Camera, Compass, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner';
import { PeepBubble } from '../components/PeepBubble';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { useProfile } from '../context/ProfileContext';
import type { HomeScreenProps } from '../navigation/types';
import { usePresence } from '../presence/PresenceContext';
import { colors, radii, spacing, typography } from '../theme';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { profile, upsertProfile } = useProfile();
  const { peers } = usePresence();
  const [toggling, setToggling] = useState(false);

  if (!profile) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.electricPurple} />
          <Text style={styles.loading}>Loading your Peep…</Text>
          <PillButton
            label="Create Your Peep"
            onPress={() =>
              navigation.getParent()?.navigate('CreatePeep', { mode: 'create' })
            }
          />
        </View>
      </Screen>
    );
  }

  const onToggle = async (next: boolean) => {
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
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Peepzi</Text>
          <Text style={styles.hello}>hey {profile.name} {profile.avatarEmoji}</Text>
        </View>
        <View style={styles.badgeRow}>
          <Sparkles size={16} color={colors.electricPurple} />
          <Text style={styles.badgeCount}>{profile.badges.length} badges</Text>
        </View>
      </View>

      <ConnectionStatusBanner />

      <View style={styles.stage}>
        <PeepBubble profile={{ ...profile, hideAge: true }} size="lg" float />
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>
            {profile.discoverable ? 'You’re discoverable 👀' : 'Hidden mode 🔒'}
          </Text>
          <Text style={styles.toggleSub}>
            {profile.discoverable
              ? 'Family test peers can see your bubble. Flip off anytime.'
              : 'Default is OFF. Turn on only when you want to be seen.'}
          </Text>
        </View>
        {toggling ? (
          <ActivityIndicator color={colors.electricPurple} />
        ) : (
          <Switch
            value={profile.discoverable}
            onValueChange={onToggle}
            trackColor={{ false: colors.surfaceBorder, true: colors.lime }}
            thumbColor={colors.surface}
            accessibilityLabel="Discoverable"
          />
        )}
      </View>

      <View style={styles.actions}>
        <PillButton
          label={`Discover Peeps${peers.length ? ` (${peers.length})` : ''}`}
          icon={<Compass size={18} color={colors.textInverse} />}
          onPress={() => navigation.navigate('Discover')}
        />
        <PillButton
          label="AR Camera"
          variant="lime"
          icon={<Camera size={18} color={colors.textInverse} />}
          onPress={() => navigation.navigate('Camera')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loading: { ...typography.body },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  brand: {
    ...typography.h2,
    color: colors.electricPurpleDeep,
  },
  hello: {
    ...typography.caption,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeCount: {
    fontWeight: '800',
    color: colors.electricPurpleDeep,
    fontSize: 12,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleCopy: { flex: 1, gap: 4 },
  toggleTitle: { ...typography.bodyStrong },
  toggleSub: { ...typography.caption, lineHeight: 18 },
  actions: { gap: spacing.sm, paddingBottom: spacing.sm },
});
