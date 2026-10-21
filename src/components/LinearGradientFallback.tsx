import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors } from '../theme';

/**
 * Soft dark purple→blue atmosphere without expo-linear-gradient
 * (keeps the dependency surface minimal for Expo Go).
 */
export function LinearGradientFallback({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.root, style]} {...rest}>
      <View style={styles.blobPurple} pointerEvents="none" />
      <View style={styles.blobBlue} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  blobPurple: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.purpleDeep,
    opacity: 0.28,
  },
  blobBlue: {
    position: 'absolute',
    bottom: -40,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.blueDeep,
    opacity: 0.22,
  },
});
