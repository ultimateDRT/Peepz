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
};

export function PeepBubble({ profile, size = 'lg' }: Props) {
  const isLarge = size === 'lg';
  const statusColor = STATUS_COLORS[profile.status];
  const initial = profile.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[styles.wrap, isLarge ? styles.wrapLg : styles.wrapMd]}
      accessibilityLabel={`${profile.name}, age ${profile.age}, ${PEEP_STATUS_LABELS[profile.status]}`}
    >
      <View style={[styles.glow, { shadowColor: statusColor }]} />
      <View style={[styles.bubble, isLarge ? styles.bubbleLg : styles.bubbleMd]}>
        <View style={[styles.avatar, isLarge ? styles.avatarLg : styles.avatarMd]}>
          <Text style={[styles.initial, isLarge ? styles.initialLg : styles.initialMd]}>
            {initial}
          </Text>
        </View>
        <Text
          style={[styles.name, isLarge ? styles.nameLg : styles.nameMd]}
          numberOfLines={1}
        >
          {profile.name}
        </Text>
        <Text style={styles.meta}>{profile.age}</Text>
        <View style={[styles.pill, { backgroundColor: `${statusColor}22` }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.pillText, { color: statusColor }]} numberOfLines={1}>
            {PEEP_STATUS_LABELS[profile.status]}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapLg: {
    width: 220,
    height: 220,
  },
  wrapMd: {
    width: 160,
    height: 160,
  },
  glow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radii.full,
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  bubbleLg: {
    minWidth: 180,
  },
  bubbleMd: {
    minWidth: 140,
  },
  avatar: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.blueSoft,
    marginBottom: spacing.xs,
  },
  avatarLg: {
    width: 56,
    height: 56,
  },
  avatarMd: {
    width: 40,
    height: 40,
  },
  initial: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  initialLg: {
    fontSize: 24,
  },
  initialMd: {
    fontSize: 18,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  nameLg: {
    fontSize: 18,
  },
  nameMd: {
    fontSize: 15,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: spacing.xs,
    maxWidth: '100%',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
