import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { colors, getBubbleTheme, radii, shadows, spacing } from '../theme';
import {
  PEEP_STATUS_EMOJI,
  PEEP_STATUS_LABELS,
  type PeepStatus,
} from '../types/peep';

type BubbleProfile = {
  name: string;
  status: PeepStatus;
  avatarEmoji?: string;
  bubbleThemeId?: string;
  age?: number;
  /** When true, age is never rendered (default for public discover cards). */
  hideAge?: boolean;
};

type Props = {
  profile: BubbleProfile;
  size?: 'sm' | 'md' | 'lg';
  showHead?: boolean;
  float?: boolean;
};

export function PeepBubble({
  profile,
  size = 'lg',
  showHead = true,
  float = true,
}: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const theme = getBubbleTheme(profile.bubbleThemeId);
  const isLarge = size === 'lg';
  const isSm = size === 'sm';
  const bob = useSharedValue(0);

  useEffect(() => {
    if (!float || reduceMotion) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [bob, float, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  const avatar = profile.avatarEmoji || '😎';
  const mood = PEEP_STATUS_EMOJI[profile.status];

  return (
    <Animated.View
      style={[styles.wrap, floatStyle]}
      accessibilityLabel={`${profile.name}, ${PEEP_STATUS_LABELS[profile.status]}`}
    >
      <View
        style={[
          styles.balloon,
          isLarge && styles.balloonLg,
          isSm && styles.balloonSm,
          shadows.float,
        ]}
      >
        <LinearGradient
          colors={[theme.from, theme.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheen} />
        <Text style={[styles.avatar, isLarge && styles.avatarLg, isSm && styles.avatarSm]}>
          {avatar}
        </Text>
        <Text
          style={[styles.name, isLarge && styles.nameLg, isSm && styles.nameSm]}
          numberOfLines={1}
        >
          {profile.name}
        </Text>
        <View style={styles.moodPill}>
          <Text style={styles.moodEmoji}>{mood}</Text>
          <Text style={styles.moodText} numberOfLines={1}>
            {PEEP_STATUS_LABELS[profile.status]}
          </Text>
        </View>
      </View>

      <View style={styles.tailWrap}>
        <View style={[styles.tail, { borderTopColor: theme.to }]} />
      </View>

      {showHead ? (
        <View
          style={[
            styles.head,
            isLarge && styles.headLg,
            isSm && styles.headSm,
            { borderColor: theme.from },
          ]}
        >
          <Text style={[styles.headEmoji, isLarge && styles.headEmojiLg]}>
            {avatar}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  balloon: {
    minWidth: 150,
    maxWidth: 210,
    borderRadius: radii.bubble,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  balloonLg: {
    minWidth: 190,
    maxWidth: 240,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  balloonSm: {
    minWidth: 120,
    maxWidth: 150,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sheen: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 54,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  avatar: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarLg: {
    fontSize: 36,
  },
  avatarSm: {
    fontSize: 22,
  },
  name: {
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  nameLg: {
    fontSize: 20,
  },
  nameSm: {
    fontSize: 14,
  },
  ageMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  moodPill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    maxWidth: '100%',
  },
  moodEmoji: {
    fontSize: 13,
  },
  moodText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  tailWrap: {
    marginTop: -1,
    zIndex: 1,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  head: {
    marginTop: spacing.sm,
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  headLg: {
    width: 58,
    height: 58,
  },
  headSm: {
    width: 36,
    height: 36,
  },
  headEmoji: {
    fontSize: 22,
  },
  headEmojiLg: {
    fontSize: 26,
  },
});
