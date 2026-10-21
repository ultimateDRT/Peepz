import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { PeepBubble } from '../components/PeepBubble';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { useProfile } from '../context/ProfileContext';
import type { ProfileScreenProps } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';
import { COSMETIC_BADGES } from '../types/peep';

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { profile } = useProfile();

  if (!profile) {
    return (
      <Screen>
        <Text style={styles.title}>Your Profile</Text>
        <PillButton
          label="Create Your Peep"
          onPress={() =>
            navigation.getParent()?.navigate('CreatePeep', { mode: 'create' })
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Your Profile 😎</Text>
      <Text style={styles.sub}>
        Nickname, mood & bubble drip. Age is private by default.
      </Text>

      <View style={styles.preview}>
        <PeepBubble profile={{ ...profile, hideAge: true }} size="md" />
      </View>

      <Card style={styles.info}>
        <Row label="Nickname" value={profile.name} />
        <Row
          label="Age"
          value={profile.agePrivate ? `${profile.age} · private 🔒` : String(profile.age)}
        />
        <Row label="Mood" value={`${profile.avatarEmoji}  · see status`} />
        <Row label="Bubble theme" value={String(profile.bubbleThemeId)} />
      </Card>

      <Text style={styles.section}>Cosmetic badges</Text>
      <Text style={styles.badgeHint}>
        Sticker trophies for customising — zero popularity rankings.
      </Text>
      <View style={styles.badges}>
        {COSMETIC_BADGES.map((badge) => {
          const earned = profile.badges.includes(badge.id);
          return (
            <View
              key={badge.id}
              style={[styles.badge, !earned && styles.badgeLocked]}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          );
        })}
      </View>

      <PillButton
        label="Edit Peep ✨"
        onPress={() =>
          navigation.getParent()?.navigate('CreatePeep', { mode: 'edit' })
        }
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1 },
  sub: { ...typography.body, marginBottom: spacing.md },
  preview: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  info: { gap: spacing.sm, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: { ...typography.caption },
  rowValue: { ...typography.bodyStrong, flexShrink: 1, textAlign: 'right' },
  section: { ...typography.label, marginBottom: spacing.xs },
  badgeHint: { ...typography.caption, marginBottom: spacing.sm },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.electricPurple,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  badgeLocked: {
    opacity: 0.4,
    borderColor: colors.surfaceBorder,
  },
  badgeEmoji: { fontSize: 24 },
  badgeLabel: { fontWeight: '800', color: colors.textPrimary, fontSize: 13 },
});
