import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  padded?: boolean;
};

export function Screen({
  children,
  style,
  edges = ['top', 'left', 'right', 'bottom'],
  padded = true,
}: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.lavenderSoft, colors.background, colors.backgroundAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.blobCyan} pointerEvents="none" />
      <View style={styles.blobCoral} pointerEvents="none" />
      <View style={styles.blobLime} pointerEvents="none" />
      <SafeAreaView
        style={[styles.safe, padded && styles.padded, style]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  blobCyan: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.cyan,
    opacity: 0.18,
  },
  blobCoral: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.coral,
    opacity: 0.12,
  },
  blobLime: {
    position: 'absolute',
    bottom: -30,
    right: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.lime,
    opacity: 0.14,
  },
});
