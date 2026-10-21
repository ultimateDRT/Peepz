import { Wifi, WifiOff } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePresence } from '../presence/PresenceContext';
import type { ConnectionStatus } from '../presence/types';
import { colors, radii, spacing } from '../theme';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Presence idle',
  connecting: 'Connecting…',
  connected: 'Live on Wi‑Fi',
  reconnecting: 'Reconnecting…',
  error: 'Connection issue',
  disconnected: 'Disconnected',
};

export function ConnectionStatusBanner() {
  const { connectionStatus, connectionError, clearError, serverHost } =
    usePresence();
  const ok = connectionStatus === 'connected';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {ok ? (
          <Wifi size={16} color={colors.success} />
        ) : (
          <WifiOff size={16} color={colors.coralDeep} />
        )}
        <Text style={styles.label}>{STATUS_LABEL[connectionStatus]}</Text>
      </View>
      <Text style={styles.host} numberOfLines={1}>
        {serverHost}
      </Text>
      {connectionError ? (
        <Pressable onPress={clearError} accessibilityRole="button">
          <Text style={styles.error}>{connectionError}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  host: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
