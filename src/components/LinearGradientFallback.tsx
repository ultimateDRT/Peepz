import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors } from '../theme';

/**
 * Soft light atmosphere — faint purple/blue wash on a clean background.
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
    top: -100,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.purpleSoft,
    opacity: 0.12,
  },
  blobBlue: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.blueSoft,
    opacity: 0.1,
  },
});
