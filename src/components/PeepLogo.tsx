import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type Props = {
  size?: 'sm' | 'lg';
};

/** Minimal mark: a tiny speech bubble, matching the Peep metaphor. */
export function PeepLogo({ size = 'lg' }: Props) {
  const isLarge = size === 'lg';
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={[styles.mark, isLarge ? styles.markLg : styles.markSm]}>
        <View style={[styles.bubble, isLarge ? styles.bubbleLg : styles.bubbleSm]} />
        <View style={[styles.tail, isLarge ? styles.tailLg : styles.tailSm]} />
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
  },
  markLg: {
    width: 72,
  },
  markSm: {
    width: 40,
  },
  bubble: {
    backgroundColor: colors.purple,
    borderRadius: 16,
    shadowColor: colors.purple,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bubbleLg: {
    width: 56,
    height: 40,
  },
  bubbleSm: {
    width: 32,
    height: 22,
    borderRadius: 10,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.purple,
    marginTop: -1,
  },
  tailLg: {
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
  },
  tailSm: {
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
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
