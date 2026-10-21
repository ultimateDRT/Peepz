import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { colors, radii, shadows, spacing, typography } from '../theme';

type Props = {
  size?: 'sm' | 'lg';
};

export function PeepLogo({ size = 'lg' }: Props) {
  const isLarge = size === 'lg';
  const reduceMotion = usePrefersReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse, reduceMotion]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Animated.View style={[styles.mark, isLarge ? styles.markLg : styles.markSm, anim]}>
        <LinearGradient
          colors={[colors.electricPurple, colors.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, isLarge ? styles.bubbleLg : styles.bubbleSm, shadows.glow]}
        />
        <View style={[styles.tail, isLarge ? styles.tailLg : styles.tailSm]} />
        <Text style={[styles.face, isLarge ? styles.faceLg : styles.faceSm]}>😎</Text>
      </Animated.View>
      <Text style={[typography.brand, !isLarge && styles.wordSm]}>Peepzi</Text>
      {isLarge ? (
        <Text style={styles.tag}>Be seen your way ✨</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLg: {
    width: 96,
    height: 96,
  },
  markSm: {
    width: 56,
    height: 56,
  },
  bubble: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  bubbleLg: {
    width: 72,
    height: 52,
  },
  bubbleSm: {
    width: 42,
    height: 30,
    borderRadius: 14,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.cyan,
    marginTop: -1,
  },
  tailLg: {
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
  },
  tailSm: {
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
  },
  face: {
    position: 'absolute',
    top: 10,
  },
  faceLg: {
    fontSize: 22,
  },
  faceSm: {
    fontSize: 14,
    top: 6,
  },
  wordSm: {
    fontSize: 22,
  },
  tag: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
});
