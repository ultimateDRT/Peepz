import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import {
  PEEP_STATUSES,
  PEEP_STATUS_LABELS,
  type PeepStatus,
} from '../types/peep';

const STATUS_COLORS: Record<PeepStatus, string> = {
  available: colors.statusAvailable,
  looking: colors.statusLooking,
  busy: colors.statusBusy,
  dnd: colors.statusDnd,
};

type Props = {
  value: PeepStatus;
  onChange: (status: PeepStatus) => void;
};

export function StatusPicker({ value, onChange }: Props) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {PEEP_STATUSES.map((status) => {
        const selected = value === status;
        const accent = STATUS_COLORS[status];
        return (
          <Pressable
            key={status}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(status)}
            style={[
              styles.option,
              selected && { borderColor: accent, backgroundColor: `${accent}18` },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <Text style={[styles.label, selected && { color: colors.textPrimary }]}>
              {PEEP_STATUS_LABELS[status]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundMuted,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
