import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadProfile, saveProfile } from '../storage/profileStorage';
import type { PeepProfile } from '../types/peep';

type ProfileContextValue = {
  profile: PeepProfile | null;
  bootstrapping: boolean;
  upsertProfile: (profile: PeepProfile) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PeepProfile | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const refreshProfile = useCallback(async () => {
    const stored = await loadProfile();
    setProfile(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadProfile();
        if (!cancelled) setProfile(stored);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upsertProfile = useCallback(async (next: PeepProfile) => {
    await saveProfile(next);
    setProfile(next);
  }, []);

  const value = useMemo(
    () => ({ profile, bootstrapping, upsertProfile, refreshProfile }),
    [profile, bootstrapping, upsertProfile, refreshProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return ctx;
}
