/**
 * Stub API for a future Nearby Interaction Expo module.
 * Safe to import in Expo Go — discoverability is local-only in v0.1.
 */

export type NearbyAvailability = {
  available: boolean;
  reason: string;
};

export function getNearbyInteractionAvailability(): NearbyAvailability {
  return {
    available: false,
    reason:
      'Nearby Interaction requires a custom native iOS build and entitlements. v0.1 only stores the Discoverable preference locally.',
  };
}

export async function startNearbySession(_discoverable: boolean): Promise<never> {
  throw new Error(getNearbyInteractionAvailability().reason);
}
