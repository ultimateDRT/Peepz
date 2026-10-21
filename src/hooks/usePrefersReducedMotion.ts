import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useProfile } from '../context/ProfileContext';

/** Combines OS reduce-motion with the in-app Settings toggle. */
export function usePrefersReducedMotion(): boolean {
  const { profile } = useProfile();
  const [osReduce, setOsReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setOsReduce(Boolean(v));
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setOsReduce,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return osReduce || Boolean(profile?.preferReducedMotion);
}
