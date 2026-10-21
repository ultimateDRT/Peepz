import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CelebrationBurst } from '../components/CelebrationBurst';
import { FormField } from '../components/FormField';
import { PeepBubble } from '../components/PeepBubble';
import { PillButton } from '../components/PillButton';
import { Screen } from '../components/Screen';
import { StatusPicker } from '../components/StatusPicker';
import { useProfile } from '../context/ProfileContext';
import type { CreatePeepScreenProps } from '../navigation/types';
import { BUBBLE_THEMES, colors, radii, spacing, typography } from '../theme';
import {
  AVATAR_EMOJIS,
  defaultProfileFields,
  type PeepStatus,
} from '../types/peep';
import { computeBadgesForSave } from '../utils/badges';

export function CreatePeepScreen({ navigation, route }: CreatePeepScreenProps) {
  const { profile, upsertProfile } = useProfile();
  const isEdit = route.params.mode === 'edit';
  const defaults = defaultProfileFields();

  const [name, setName] = useState(profile?.name ?? '');
  const [ageText, setAgeText] = useState(
    profile?.age != null ? String(profile.age) : '',
  );
  const [status, setStatus] = useState<PeepStatus>(profile?.status ?? 'available');
  const [avatarEmoji, setAvatarEmoji] = useState(
    profile?.avatarEmoji ?? defaults.avatarEmoji,
  );
  const [bubbleThemeId, setBubbleThemeId] = useState(
    profile?.bubbleThemeId ?? defaults.bubbleThemeId,
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'Nickname is required';
    if (trimmed.length < 2) return 'Use at least 2 characters';
    return null;
  }, [name]);

  const ageError = useMemo(() => {
    if (!ageText.trim()) return 'Age is required';
    const age = Number(ageText);
    if (!Number.isInteger(age)) return 'Enter a whole number';
    if (age < 13 || age > 17) return 'Peepzi is for ages 13–17';
    return null;
  }, [ageText]);

  const canSave = !nameError && !ageError && !saving;

  const previewAge = Number(ageText);
  const preview = {
    name: name.trim() || 'Your Peep',
    status,
    avatarEmoji,
    bubbleThemeId,
    age: Number.isInteger(previewAge) ? previewAge : undefined,
    hideAge: true,
  };

  const onSave = async () => {
    if (nameError || ageError) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const base = {
        ...(profile ?? {
          ...defaults,
          name: '',
          age: 13,
          status: 'available' as PeepStatus,
          updatedAt: new Date().toISOString(),
        }),
        name: name.trim(),
        age: Number(ageText),
        agePrivate: profile?.agePrivate ?? true,
        status,
        avatarEmoji,
        bubbleThemeId,
        discoverable: profile?.discoverable ?? false,
        updatedAt: new Date().toISOString(),
      };
      const badges = computeBadgesForSave(base, {
        created: !isEdit,
        themeChanged: bubbleThemeId !== 'violet' || isEdit,
        emojiChanged: avatarEmoji !== '😎' || isEdit,
        statusTouched: true,
      });
      await upsertProfile({ ...base, badges });
      setCelebrate(true);
      setTimeout(() => {
        if (isEdit) navigation.goBack();
        else navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }, 700);
    } catch {
      setSubmitError('Could not save your Peep. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <CelebrationBurst visible={celebrate} onDone={() => setCelebrate(false)} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {isEdit ? 'Remix your Peep 🎨' : 'Create Your Peep ✨'}
          </Text>
          <Text style={styles.sub}>
            Nickname + vibe + bubble drip. Age stays private by default.
          </Text>

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Live preview</Text>
            <PeepBubble profile={preview} size="md" />
          </View>

          <FormField
            label="Nickname"
            value={name}
            onChangeText={setName}
            placeholder="What should float above you?"
            error={name.trim().length > 0 || submitError ? nameError : null}
            autoCapitalize="words"
            maxLength={32}
          />
          <FormField
            label="Age (private)"
            value={ageText}
            onChangeText={(t) => setAgeText(t.replace(/[^0-9]/g, ''))}
            placeholder="13–17"
            keyboardType="number-pad"
            error={ageText.length > 0 || submitError ? ageError : null}
            maxLength={2}
          />

          <Text style={styles.section}>Avatar sticker</Text>
          <View style={styles.emojiRow}>
            {AVATAR_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setAvatarEmoji(emoji)}
                style={[
                  styles.emojiChip,
                  avatarEmoji === emoji && styles.emojiChipOn,
                ]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Bubble colour</Text>
          <View style={styles.themeRow}>
            {BUBBLE_THEMES.map((theme) => (
              <Pressable
                key={theme.id}
                onPress={() => setBubbleThemeId(theme.id)}
                style={[
                  styles.themeDot,
                  { backgroundColor: theme.from },
                  bubbleThemeId === theme.id && styles.themeDotOn,
                ]}
                accessibilityLabel={theme.label}
              />
            ))}
          </View>

          <Text style={styles.section}>Mood</Text>
          <StatusPicker value={status} onChange={setStatus} />

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          {isEdit ? (
            <PillButton
              label="Cancel"
              variant="ghost"
              onPress={() => navigation.goBack()}
            />
          ) : null}
          <PillButton
            label={isEdit ? 'Save my drip 💜' : 'Drop my Peep 🚀'}
            onPress={onSave}
            disabled={!canSave}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { ...typography.h1 },
  sub: { ...typography.body, marginBottom: spacing.sm },
  preview: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  previewLabel: { ...typography.label },
  section: {
    ...typography.label,
    marginTop: spacing.sm,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChipOn: {
    borderColor: colors.electricPurple,
    backgroundColor: colors.lavenderSoft,
  },
  emoji: { fontSize: 24 },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeDot: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  themeDotOn: {
    borderColor: colors.textPrimary,
    transform: [{ scale: 1.12 }],
  },
  submitError: {
    color: colors.danger,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceBorder,
    backgroundColor: colors.background,
  },
});
