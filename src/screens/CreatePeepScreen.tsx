import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormField } from '../components/FormField';
import { LinearGradientFallback } from '../components/LinearGradientFallback';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusPicker } from '../components/StatusPicker';
import { useProfile } from '../context/ProfileContext';
import type { CreatePeepScreenProps } from '../navigation/types';
import { colors, spacing, typography } from '../theme';
import type { PeepStatus } from '../types/peep';

export function CreatePeepScreen({ navigation, route }: CreatePeepScreenProps) {
  const { profile, upsertProfile } = useProfile();
  const isEdit = route.params.mode === 'edit';

  const [name, setName] = useState(profile?.name ?? '');
  const [ageText, setAgeText] = useState(
    profile?.age != null ? String(profile.age) : '',
  );
  const [status, setStatus] = useState<PeepStatus>(profile?.status ?? 'available');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length < 2) return 'Use at least 2 characters';
    return null;
  }, [name]);

  const ageError = useMemo(() => {
    if (!ageText.trim()) return 'Age is required';
    const age = Number(ageText);
    if (!Number.isInteger(age)) return 'Enter a whole number';
    if (age < 13 || age > 120) return 'Age must be between 13 and 120';
    return null;
  }, [ageText]);

  const canSave = !nameError && !ageError && !saving;

  const onSave = async () => {
    if (nameError || ageError) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await upsertProfile({
        name: name.trim(),
        age: Number(ageText),
        status,
        discoverable: profile?.discoverable ?? false,
        updatedAt: new Date().toISOString(),
      });
      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch {
      setSubmitError('Could not save your Peep. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradientFallback>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {isEdit ? 'Edit Your Peep' : 'Create Your Peep'}
            </Text>
            <Text style={styles.sub}>
              {isEdit
                ? 'Update how nearby people will see you.'
                : 'This is your floating social bubble. You can change it anytime.'}
            </Text>

            <View style={styles.form}>
              <FormField
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="How should people see you?"
                error={name.trim().length > 0 || submitError ? nameError : null}
                autoCapitalize="words"
                maxLength={32}
              />
              <FormField
                label="Age"
                value={ageText}
                onChangeText={(t) => setAgeText(t.replace(/[^0-9]/g, ''))}
                placeholder="Your age"
                keyboardType="number-pad"
                error={ageText.length > 0 || submitError ? ageError : null}
                maxLength={3}
              />
              <View style={styles.statusBlock}>
                <Text style={styles.statusLabel}>Status</Text>
                <StatusPicker value={status} onChange={setStatus} />
              </View>
            </View>

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            {isEdit ? (
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => navigation.goBack()}
                style={styles.cancel}
              />
            ) : null}
            <PrimaryButton
              label={isEdit ? 'Save changes' : 'Save Peep'}
              onPress={onSave}
              disabled={!canSave}
              loading={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradientFallback>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  sub: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  statusBlock: {
    gap: spacing.sm,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitError: {
    color: colors.danger,
    fontWeight: '600',
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
  cancel: {
    minHeight: 44,
  },
});
