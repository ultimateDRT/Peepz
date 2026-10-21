import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import {
  PEEP_STATUSES,
  PEEP_STATUS_EMOJI,
  PEEP_STATUS_LABELS,
  type PeepStatus,
} from '../types/peep';

type Props = {
  value: PeepStatus;
  onChange: (status: PeepStatus) => void;
};

export function StatusPicker({ value, onChange }: Props) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {PEEP_STATUSES.map((status) => {
        const selected = value === status;
        return (
          <Pressable
            key={status}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(status)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={styles.emoji}>{PEEP_STATUS_EMOJI[status]}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>
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
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.electricPurple,
    backgroundColor: colors.lavenderSoft,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  labelSelected: {
    color: colors.textPrimary,
  },
});
