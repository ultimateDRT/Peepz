import { Shield, Accessibility, EyeOff, Ban } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { useProfile } from '../context/ProfileContext';
import type { SettingsScreenProps } from '../navigation/types';
import { usePresence } from '../presence/PresenceContext';
import { clearProfile } from '../storage/profileStorage';
import { colors, spacing, typography } from '../theme';

export function SettingsScreen(_props: SettingsScreenProps) {
  const { profile, upsertProfile, refreshProfile } = useProfile();
  const { peers } = usePresence();
  const [busy, setBusy] = useState(false);

  if (!profile) {
    return (
      <Screen>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.sub}>Create a Peep first.</Text>
      </Screen>
    );
  }

  const patch = async (partial: Partial<typeof profile>) => {
    setBusy(true);
    try {
      await upsertProfile({
        ...profile,
        ...partial,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setBusy(false);
    }
  };

  const blockPeer = (deviceId: string, name: string) => {
    Alert.alert('Block this Peep?', `${name} won’t show up in Discover.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          void patch({
            blockedDeviceIds: Array.from(
              new Set([...profile.blockedDeviceIds, deviceId]),
            ),
          });
        },
      },
    ]);
  };

  const resetPeep = () => {
    Alert.alert('Reset local Peep?', 'This clears your profile on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearProfile();
          await refreshProfile();
        },
      },
    ]);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings ⚙️</Text>
        <Text style={styles.sub}>
          Privacy-first controls. No unsolicited DMs. No popularity rankings.
        </Text>

        <Section
          icon={<EyeOff size={18} color={colors.electricPurple} />}
          title="Visibility"
        >
          <ToggleRow
            label="Discoverable"
            hint="Off by default. Instant hide when disabled."
            value={profile.discoverable}
            disabled={busy}
            onChange={(v) => void patch({ discoverable: v })}
          />
          <ToggleRow
            label="Keep age private"
            hint="Age never appears on Discover cards."
            value={profile.agePrivate}
            disabled={busy}
            onChange={(v) => void patch({ agePrivate: v })}
          />
        </Section>

        <Section
          icon={<Shield size={18} color={colors.coralDeep} />}
          title="Safety"
        >
          <Text style={styles.cardBody}>
            Peepzi doesn’t enable random messaging between teens. Blocking only
            hides someone on your Discover list.
          </Text>
          {peers.length === 0 ? (
            <Text style={styles.muted}>No connected peeps to block right now.</Text>
          ) : (
            peers.map((p) => {
              const blocked = profile.blockedDeviceIds.includes(p.deviceId);
              return (
                <View key={p.deviceId} style={styles.blockRow}>
                  <Text style={styles.blockName}>
                    {p.name} {blocked ? '· blocked' : ''}
                  </Text>
                  <PillButton
                    label={blocked ? 'Blocked' : 'Block'}
                    variant={blocked ? 'ghost' : 'danger'}
                    disabled={blocked || busy}
                    onPress={() => blockPeer(p.deviceId, p.name)}
                    style={styles.blockBtn}
                  />
                </View>
              );
            })
          )}
          {profile.blockedDeviceIds.length > 0 ? (
            <PillButton
              label="Clear all blocks"
              variant="secondary"
              icon={<Ban size={16} color={colors.textPrimary} />}
              onPress={() => void patch({ blockedDeviceIds: [] })}
            />
          ) : null}
        </Section>

        <Section
          icon={<Accessibility size={18} color={colors.cyanDeep} />}
          title="Accessibility"
        >
          <ToggleRow
            label="Reduce motion"
            hint="Turns off floating / celebration animations."
            value={profile.preferReducedMotion}
            disabled={busy}
            onChange={(v) => void patch({ preferReducedMotion: v })}
          />
        </Section>

        <PillButton
          label="Reset local Peep"
          variant="secondary"
          onPress={resetPeep}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </Screen>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceBorder, true: colors.lime }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: { ...typography.h1 },
  sub: { ...typography.body, marginBottom: spacing.sm },
  section: { gap: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { ...typography.title },
  cardBody: { ...typography.body },
  muted: { ...typography.caption },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleCopy: { flex: 1, gap: 2 },
  toggleLabel: { ...typography.bodyStrong },
  toggleHint: { ...typography.caption, lineHeight: 16 },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  blockName: { ...typography.bodyStrong, flex: 1 },
  blockBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
});
