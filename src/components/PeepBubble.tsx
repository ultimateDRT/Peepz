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

/**
 * Circular floating Peep bubble — the AR-style social orb preview.
 * Circle holds identity; status caption sits under the orb.
 */
export function PeepBubble({ profile, size = 'lg' }: Props) {
  const isLarge = size === 'lg';
  const statusColor = STATUS_COLORS[profile.status];
  const initial = profile.name.trim().charAt(0).toUpperCase() || '?';
  const diameter = isLarge ? 168 : 120;

  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`${profile.name}, age ${profile.age}, ${PEEP_STATUS_LABELS[profile.status]}`}
    >
      {/* Soft glow behind the circle */}
      <View
        style={[
          styles.glow,
          {
            width: diameter + 24,
            height: diameter + 24,
            borderRadius: (diameter + 24) / 2,
            shadowColor: statusColor,
            backgroundColor: `${statusColor}18`,
          },
        ]}
      />

      {/* Outer status ring */}
      <View
        style={[
          styles.ring,
          {
            width: diameter + 10,
            height: diameter + 10,
            borderRadius: (diameter + 10) / 2,
            borderColor: statusColor,
          },
        ]}
      >
        {/* Inner circular bubble */}
        <View
          style={[
            styles.bubble,
            {
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
            },
          ]}
        >
          <View style={styles.fillPurple} />
          <View style={styles.fillBlue} />
          <View
            style={[
              styles.highlight,
              isLarge ? styles.highlightLg : styles.highlightMd,
            ]}
          />
          <Text
            style={[styles.initial, isLarge ? styles.initialLg : styles.initialMd]}
          >
            {initial}
          </Text>
          <Text
            style={[styles.name, isLarge ? styles.nameLg : styles.nameMd]}
            numberOfLines={1}
          >
            {profile.name}
          </Text>
          <Text style={[styles.age, isLarge ? styles.ageLg : styles.ageMd]}>
            {profile.age}
          </Text>
        </View>
      </View>

      {/* Status under the bubble */}
      <View style={[styles.caption, { backgroundColor: `${statusColor}22` }]}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text
          style={[styles.captionText, { color: statusColor }]}
          numberOfLines={1}
        >
          {PEEP_STATUS_LABELS[profile.status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  glow: {
    position: 'absolute',
    top: -6,
    shadowOpacity: 0.65,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 2,
    borderColor: colors.purpleSoft,
    overflow: 'hidden',
    shadowColor: colors.purple,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fillPurple: {
    position: 'absolute',
    top: '-20%',
    left: '-15%',
    width: '70%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: colors.purpleDeep,
    opacity: 0.45,
  },
  fillBlue: {
    position: 'absolute',
    bottom: '-25%',
    right: '-20%',
    width: '75%',
    height: '75%',
    borderRadius: 999,
    backgroundColor: colors.blueDeep,
    opacity: 0.4,
  },
  highlight: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.full,
  },
  highlightLg: {
    width: 48,
    height: 22,
  },
  highlightMd: {
    width: 34,
    height: 16,
  },
  initial: {
    color: colors.purpleSoft,
    fontWeight: '800',
    marginBottom: 2,
  },
  initialLg: {
    fontSize: 36,
  },
  initialMd: {
    fontSize: 26,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    maxWidth: '85%',
  },
  nameLg: {
    fontSize: 16,
  },
  nameMd: {
    fontSize: 13,
  },
  age: {
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  ageLg: {
    fontSize: 13,
  },
  ageMd: {
    fontSize: 11,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    maxWidth: 220,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
  },
  captionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
