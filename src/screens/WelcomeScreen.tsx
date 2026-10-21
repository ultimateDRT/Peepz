import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradientFallback } from '../components/LinearGradientFallback';
import { PeepLogo } from '../components/PeepLogo';
import { PrimaryButton } from '../components/PrimaryButton';
import type { WelcomeScreenProps } from '../navigation/types';
import { spacing, typography } from '../theme';

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <LinearGradientFallback>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <PeepLogo size="lg" />
          <Text style={styles.tagline}>Create your Peep. Be seen your way.</Text>
          <Text style={styles.sub}>
            Your social presence floats nearby — start with a Peep profile, then
            decide when you are discoverable.
          </Text>
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            label="Create Your Peep"
            onPress={() => navigation.navigate('CreatePeep', { mode: 'create' })}
          />
        </View>
      </SafeAreaView>
    </LinearGradientFallback>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  tagline: {
    ...typography.h2,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sub: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
