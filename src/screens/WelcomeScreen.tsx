import { StyleSheet, Text, View } from 'react-native';
import { PeepLogo } from '../components/PeepLogo';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import type { WelcomeScreenProps } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <Screen>
      <View style={styles.content}>
        <PeepLogo size="lg" />
        <Text style={styles.headline}>Create your Peep.{'\n'}Be seen your way.</Text>
        <Text style={styles.sub}>
          Float your vibe above the crowd — customise your bubble, pick a mood,
          and only go discoverable when you say so.
        </Text>
        <View style={styles.stickers}>
          <Text style={styles.sticker}>⚡</Text>
          <Text style={styles.sticker}>💜</Text>
          <Text style={styles.sticker}>🌈</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <PillButton
          label="Let’s make your Peep ✨"
          onPress={() => navigation.navigate('CreatePeep', { mode: 'create' })}
        />
        <Text style={styles.safety}>
          Discoverability starts OFF. Age stays private by default. No random DMs.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  sub: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
  },
  stickers: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sticker: {
    fontSize: 28,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  safety: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
