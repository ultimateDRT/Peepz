import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function Card({ children, style, padded = true }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.soft,
  },
  padded: {
    padding: spacing.md,
  },
});
