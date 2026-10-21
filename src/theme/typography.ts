import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  brand: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  } satisfies TextStyle,
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  } satisfies TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
  } satisfies TextStyle,
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  } satisfies TextStyle,
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  } satisfies TextStyle,
} as const;
