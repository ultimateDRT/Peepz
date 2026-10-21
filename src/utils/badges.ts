import type { CosmeticBadgeId, PeepProfile } from '../types/peep';

export function withBadge(
  profile: PeepProfile,
  badge: CosmeticBadgeId,
): PeepProfile {
  if (profile.badges.includes(badge)) return profile;
  return { ...profile, badges: [...profile.badges, badge] };
}

export function computeBadgesForSave(
  profile: PeepProfile,
  opts: {
    created?: boolean;
    themeChanged?: boolean;
    emojiChanged?: boolean;
    statusTouched?: boolean;
  },
): CosmeticBadgeId[] {
  let next = [...profile.badges];
  const add = (id: CosmeticBadgeId) => {
    if (!next.includes(id)) next = [...next, id];
  };
  if (opts.created) add('first_peep');
  if (opts.themeChanged) add('stylist');
  if (opts.emojiChanged) add('expressive');
  if (opts.statusTouched) add('mood_master');
  return next;
}
