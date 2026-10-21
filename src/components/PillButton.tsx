import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'lime';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  icon?: ReactNode;
  style?: ViewStyle;
  haptic?: boolean;
};

export function PillButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  style,
  haptic = true,
}: Props) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary' || variant === 'ghost'
              ? colors.electricPurple
              : colors.textInverse
          }
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              (variant === 'secondary' || variant === 'ghost') &&
                styles.labelDark,
              variant === 'danger' && styles.labelInverse,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary' || variant === 'lime') {
    const grads =
      variant === 'lime'
        ? ([colors.lime, colors.cyan] as const)
        : ([colors.electricPurple, colors.coral] as const);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.base,
          shadows.soft,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={[...grads]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.coralDeep,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
  labelDark: {
    color: colors.textPrimary,
  },
  labelInverse: {
    color: colors.textInverse,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
