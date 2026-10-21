import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner';
import { LinearGradientFallback } from '../components/LinearGradientFallback';
import { PeepBubble } from '../components/PeepBubble';
import { PrimaryButton } from '../components/PrimaryButton';
import { DISCOVERY_DEFAULTS } from '../config/discovery';
import { useProfile } from '../context/ProfileContext';
import type { DiscoverScreenProps } from '../navigation/types';
import { usePresence } from '../presence/PresenceContext';
import { colors, radii, spacing, typography } from '../theme';

export function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const { profile } = useProfile();
  const {
    peers,
    serverHost,
    setServerHost,
    connectionStatus,
    refreshPeers,
  } = usePresence();
  const [hostDraft, setHostDraft] = useState(serverHost);
  const [savingHost, setSavingHost] = useState(false);

  const onSaveHost = async () => {
    setSavingHost(true);
    try {
      await setServerHost(hostDraft);
    } finally {
      setSavingHost(false);
    }
  };

  return (
    <LinearGradientFallback>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <PrimaryButton
            label="← Back"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.back}
          />
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.sub}>
            Other Peeps in your private room
            {profile?.discoverable
              ? ' — you are discoverable.'
              : ' — turn Discoverable on to appear to others.'}
          </Text>
        </View>

        <ConnectionStatusBanner />

        <View style={styles.hostBlock}>
          <Text style={styles.hostLabel}>Presence server LAN IP</Text>
          <TextInput
            value={hostDraft}
            onChangeText={setHostDraft}
            placeholder="192.168.x.x"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            style={styles.hostInput}
          />
          <Text style={styles.hostHint}>
            Use your Windows PC Wi‑Fi IP (ipconfig). Never localhost on the phone.
            Port {DISCOVERY_DEFAULTS.serverPort}.
          </Text>
          <PrimaryButton
            label={savingHost ? 'Saving…' : 'Save & reconnect'}
            variant="secondary"
            onPress={onSaveHost}
            disabled={savingHost || !hostDraft.trim()}
            loading={savingHost}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Nearby ({peers.length})
          </Text>
          <PrimaryButton
            label="Refresh"
            variant="ghost"
            onPress={refreshPeers}
            style={styles.refresh}
          />
        </View>

        {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.purple} />
          </View>
        ) : null}

        <FlatList
          data={peers}
          keyExtractor={(item) => item.deviceId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No one else yet</Text>
              <Text style={styles.emptyBody}>
                Start the presence server on your PC, put every phone on the same
                Wi‑Fi, set the LAN IP above, and toggle Discoverable on each Peep.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.peer}>
              <PeepBubble profile={item} size="md" />
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradientFallback>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 0,
  },
  title: {
    ...typography.h1,
  },
  sub: {
    ...typography.body,
  },
  hostBlock: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
  },
  hostLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  hostInput: {
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 16,
  },
  hostHint: {
    ...typography.caption,
    lineHeight: 18,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    ...typography.bodyStrong,
  },
  refresh: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  peer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  empty: {
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    textAlign: 'center',
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
