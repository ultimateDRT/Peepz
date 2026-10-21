import { RefreshCw, Wifi } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner';
import { PeepBubble } from '../components/PeepBubble';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { DISCOVERY_DEFAULTS } from '../config/discovery';
import { useProfile } from '../context/ProfileContext';
import type { DiscoverScreenProps } from '../navigation/types';
import { usePresence } from '../presence/PresenceContext';
import { colors, radii, spacing, typography } from '../theme';

export function DiscoverScreen(_props: DiscoverScreenProps) {
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

  const visiblePeers = useMemo(() => {
    const blocked = new Set(profile?.blockedDeviceIds ?? []);
    return peers.filter((p) => !blocked.has(p.deviceId));
  }, [peers, profile?.blockedDeviceIds]);

  const onSaveHost = async () => {
    setSavingHost(true);
    try {
      await setServerHost(hostDraft);
    } finally {
      setSavingHost(false);
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.pad}>
        <Text style={styles.title}>Discover Peeps 👀</Text>
        <Text style={styles.sub}>
          {profile?.discoverable
            ? 'You’re visible in the private test room.'
            : 'You’re hidden — turn Discoverable on from Home to appear.'}
        </Text>
        <ConnectionStatusBanner />
      </View>

      <FlatList
        data={visiblePeers}
        keyExtractor={(item) => item.deviceId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Card style={styles.hostCard}>
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
                Never localhost on iPhone. Port {DISCOVERY_DEFAULTS.serverPort}.
              </Text>
              <PillButton
                label={savingHost ? 'Saving…' : 'Save & reconnect'}
                variant="secondary"
                onPress={onSaveHost}
                disabled={savingHost || !hostDraft.trim()}
                loading={savingHost}
              />
            </Card>

            <View style={styles.legend}>
              <View style={styles.legendChip}>
                <Wifi size={14} color={colors.cyanDeep} />
                <Text style={styles.legendText}>Connected (Wi‑Fi test)</Text>
              </View>
              <View style={[styles.legendChip, styles.legendMuted]}>
                <Text style={styles.legendText}>Nearby AR — coming soon</Text>
              </View>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Connected peeps ({visiblePeers.length})
              </Text>
              <PillButton
                label="Refresh"
                variant="ghost"
                icon={<RefreshCw size={16} color={colors.electricPurple} />}
                onPress={refreshPeers}
                style={styles.refresh}
              />
            </View>

            {connectionStatus === 'connecting' ||
            connectionStatus === 'reconnecting' ? (
              <ActivityIndicator color={colors.electricPurple} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Card style={styles.empty}>
            <Text style={styles.emptyTitle}>Nobody else yet 👻</Text>
            <Text style={styles.emptyBody}>
              Start the presence server, set the LAN IP, and flip Discoverable on
              each phone. These are connected test users — not GPS “nearby” yet.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.peerCard}>
            <View style={styles.peerTag}>
              <Text style={styles.peerTagText}>Connected · Wi‑Fi test</Text>
            </View>
            <PeepBubble
              profile={{
                name: item.name,
                status: item.status,
                avatarEmoji: '👾',
                bubbleThemeId: 'cyan',
                hideAge: true,
              }}
              size="md"
              float={false}
            />
            <Text style={styles.privacyNote}>Age hidden · no DMs</Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: { ...typography.h1 },
  sub: { ...typography.body },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerBlock: { gap: spacing.md, marginBottom: spacing.sm },
  hostCard: { gap: spacing.sm },
  hostLabel: { ...typography.label },
  hostInput: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  hostHint: { ...typography.caption },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.cyan,
  },
  legendMuted: {
    borderColor: colors.surfaceBorder,
    opacity: 0.75,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: { ...typography.bodyStrong },
  refresh: { minHeight: 40, paddingHorizontal: spacing.sm },
  empty: { gap: spacing.sm, alignItems: 'center' },
  emptyTitle: { ...typography.h2, textAlign: 'center' },
  emptyBody: { ...typography.body, textAlign: 'center' },
  peerCard: { alignItems: 'center', gap: spacing.sm },
  peerTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  peerTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.electricPurpleDeep,
  },
  privacyNote: { ...typography.caption },
});
