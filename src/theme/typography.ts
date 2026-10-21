import type { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  hero: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.textPrimary,
  } satisfies TextStyle,
  brand: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.textPrimary,
  } satisfies TextStyle,
  h1: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  } satisfies TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  } satisfies TextStyle,
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: colors.textSecondary,
  } satisfies TextStyle,
  bodyStrong: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  } satisfies TextStyle,
  pill: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  } satisfies TextStyle,
} as const;
