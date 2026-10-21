import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const PARTICLES = ['✨', '💜', '⚡', '🌟', '💫', '🎉'] as const;

type Props = {
  visible: boolean;
  onDone?: () => void;
};

export function CelebrationBurst({ visible, onDone }: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      onDone?.();
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withDelay(700, withTiming(0, { duration: 320 }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      })),
    );
    scale.value = withSequence(
      withTiming(1.15, { duration: 280 }),
      withTiming(1, { duration: 400 }),
    );
  }, [visible, reduceMotion, opacity, scale, onDone]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible || reduceMotion) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, style]}>
      {PARTICLES.map((p, i) => (
        <View
          key={p + i}
          style={[
            styles.particle,
            {
              transform: [
                { rotate: `${i * 60}deg` },
                { translateY: -54 - (i % 2) * 12 },
              ],
            },
          ]}
        >
          <Text style={styles.emoji}>{p}</Text>
        </View>
      ))}
      <Text style={styles.center}>✨</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  particle: {
    position: 'absolute',
  },
  emoji: {
    fontSize: 22,
  },
  center: {
    fontSize: 40,
  },
});
