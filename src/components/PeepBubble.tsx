import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import {
  PEEP_STATUS_LABELS,
  type PeepProfile,
  type PeepStatus,
} from '../types/peep';

const STATUS_COLORS: Record<PeepStatus, string> = {
  available: colors.statusAvailable,
  looking: colors.statusLooking,
  busy: colors.statusBusy,
  dnd: colors.statusDnd,
};

type Props = {
  profile: Pick<PeepProfile, 'name' | 'age' | 'status'>;
  size?: 'md' | 'lg';
  /** When true, show a soft head under the chat-bubble tail (default). */
  showHead?: boolean;
};

/**
 * Speech-bubble Peep — the shape that will float above someone’s head in AR.
 * Rounded chat balloon + downward tail + optional head avatar.
 */
export function PeepBubble({
  profile,
  size = 'lg',
  showHead = true,
}: Props) {
  const isLarge = size === 'lg';
  const statusColor = STATUS_COLORS[profile.status];
  const initial = profile.name.trim().charAt(0).toUpperCase() || '?';
  const displayName = profile.name.trim() || 'Your Peep';

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`${displayName}, age ${profile.age || '—'}, ${PEEP_STATUS_LABELS[profile.status]}`}
    >
      {/* Chat balloon */}
      <View
        style={[
          styles.balloon,
          isLarge ? styles.balloonLg : styles.balloonMd,
          { borderColor: statusColor },
        ]}
      >
        <Text
          style={[styles.name, isLarge ? styles.nameLg : styles.nameMd]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        {profile.age ? (
          <Text style={[styles.meta, isLarge ? styles.metaLg : styles.metaMd]}>
            {profile.age}
          </Text>
        ) : null}
        <View style={[styles.statusRow, { backgroundColor: `${statusColor}18` }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text
            style={[styles.statusText, { color: statusColor }]}
            numberOfLines={1}
          >
            {PEEP_STATUS_LABELS[profile.status]}
          </Text>
        </View>
      </View>

      {/* Tail pointing down toward the head */}
      <View style={styles.tailWrap}>
        <View style={[styles.tailBorder, { borderTopColor: statusColor }]} />
        <View style={styles.tailFill} />
      </View>

      {showHead ? (
        <View
          style={[
            styles.head,
            isLarge ? styles.headLg : styles.headMd,
            { borderColor: statusColor },
          ]}
        >
          <Text
            style={[styles.headInitial, isLarge ? styles.headInitialLg : styles.headInitialMd]}
          >
            {initial}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  balloon: {
    backgroundColor: colors.bubbleFill,
    borderWidth: 2,
    borderRadius: 22,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
    shadowColor: '#1C1E3C',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  balloonLg: {
    minWidth: 168,
    maxWidth: 220,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  balloonMd: {
    minWidth: 132,
    maxWidth: 180,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  nameLg: {
    fontSize: 18,
  },
  nameMd: {
    fontSize: 15,
  },
  meta: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  metaLg: {
    fontSize: 13,
  },
  metaMd: {
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    maxWidth: '100%',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tailWrap: {
    width: 20,
    height: 12,
    alignItems: 'center',
    marginTop: -1,
    zIndex: 1,
  },
  tailBorder: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    // borderTopColor set inline to status color
  },
  tailFill: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.bubbleFill,
  },
  head: {
    marginTop: spacing.sm,
    backgroundColor: colors.headFill,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C1E3C',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headLg: {
    width: 56,
    height: 56,
  },
  headMd: {
    width: 42,
    height: 42,
  },
  headInitial: {
    color: colors.purpleDeep,
    fontWeight: '800',
  },
  headInitialLg: {
    fontSize: 22,
  },
  headInitialMd: {
    fontSize: 16,
  },
});
