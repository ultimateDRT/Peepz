import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePresence } from '../presence/PresenceContext';
import type { ConnectionStatus } from '../presence/types';
import { colors, radii, spacing } from '../theme';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Presence idle',
  connecting: 'Connecting to presence…',
  connected: 'Presence connected',
  reconnecting: 'Reconnecting…',
  error: 'Presence connection error',
  disconnected: 'Presence disconnected',
};

const STATUS_COLOR: Record<ConnectionStatus, string> = {
  idle: colors.textMuted,
  connecting: colors.blue,
  connected: colors.success,
  reconnecting: colors.warning,
  error: colors.danger,
  disconnected: colors.textMuted,
};

export function ConnectionStatusBanner() {
  const { connectionStatus, connectionError, clearError, serverHost } =
    usePresence();
  const color = STATUS_COLOR[connectionStatus];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: color }]} />
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
    backgroundColor: colors.surface,
    borderRadius: radii.md,
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  host: {
    color: colors.textMuted,
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
