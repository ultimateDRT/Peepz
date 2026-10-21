/**
 * Stub API for a future ARKit Expo module.
 * Safe to import in Expo Go — all calls report unavailable.
 */

export type ArKitAvailability = {
  available: boolean;
  reason: string;
};

export function getArKitAvailability(): ArKitAvailability {
  return {
    available: false,
    reason:
      'ARKit requires a custom native iOS build. Peepzi v0.1 runs in Expo Go with a camera placeholder.',
  };
}

export async function startArSession(): Promise<never> {
  throw new Error(getArKitAvailability().reason);
}
