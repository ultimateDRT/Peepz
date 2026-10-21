import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

type Props = {
  size?: 'sm' | 'lg';
};

export function PeepLogo({ size = 'lg' }: Props) {
  const isLarge = size === 'lg';
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View
        style={[
          styles.mark,
          isLarge ? styles.markLg : styles.markSm,
        ]}
      >
        <View style={[styles.orb, isLarge ? styles.orbLg : styles.orbSm]} />
        <View style={[styles.ring, isLarge ? styles.ringLg : styles.ringSm]} />
      </View>
      <Text style={[styles.wordmark, isLarge ? styles.wordLg : styles.wordSm]}>
        Peepzi
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLg: {
    width: 88,
    height: 88,
  },
  markSm: {
    width: 48,
    height: 48,
  },
  orb: {
    backgroundColor: colors.purple,
    borderRadius: radii.full,
    shadowColor: colors.purple,
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  orbLg: {
    width: 36,
    height: 36,
  },
  orbSm: {
    width: 20,
    height: 20,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.blueSoft,
    borderRadius: radii.full,
    opacity: 0.85,
  },
  ringLg: {
    width: 72,
    height: 72,
  },
  ringSm: {
    width: 40,
    height: 40,
  },
  wordmark: {
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  wordLg: {
    fontSize: 44,
  },
  wordSm: {
    fontSize: 22,
  },
});
