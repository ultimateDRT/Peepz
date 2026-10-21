import { LinearGradient } from 'expo-linear-gradient';
import { Aperture, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { PeepBubble } from '../components/PeepBubble';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { useProfile } from '../context/ProfileContext';
import type { CameraScreenProps } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';

export function CameraScreen({ navigation }: CameraScreenProps) {
  const { profile } = useProfile();

  return (
    <Screen padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>AR Camera 📸</Text>
        <Text style={styles.sub}>
          Polished placeholder — ready for Apple ARKit later. Still Expo Go safe.
        </Text>
      </View>

      <View style={styles.stageWrap}>
        <LinearGradient
          colors={[colors.cameraStage, colors.cameraStageSoft, '#0B1020']}
          style={styles.stage}
        >
          <View style={styles.scanLine} />
          <View style={styles.hud}>
            <Aperture size={18} color={colors.cyan} />
            <Text style={styles.hudText}>WORLD TRACKING · STANDBY</Text>
          </View>

          <View style={styles.bubbleAnchor}>
            {profile ? (
              <PeepBubble
                profile={{ ...profile, hideAge: true }}
                size="md"
                float
              />
            ) : (
              <Text style={styles.missing}>Create a Peep first</Text>
            )}
          </View>

          <View style={styles.hintCard}>
            <Sparkles size={16} color={colors.lime} />
            <Text style={styles.hintText}>
              Future: float Peeps above real people via ARKit + Nearby Interaction.
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.footer}>
        <PillButton
          label="Open Discover"
          variant="secondary"
          onPress={() => navigation.navigate('Discover')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  sub: { ...typography.body },
  stageWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  stage: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(168,85,247,0.35)',
    padding: spacing.lg,
  },
  scanLine: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.cyan,
    opacity: 0.35,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hudText: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bubbleAnchor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  hintCard: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  hintText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    padding: spacing.lg,
  },
});
