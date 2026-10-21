export const PEEP_STATUSES = [
  'available',
  'looking',
  'busy',
  'dnd',
] as const;

export type PeepStatus = (typeof PEEP_STATUSES)[number];

export const PEEP_STATUS_LABELS: Record<PeepStatus, string> = {
  available: 'Available to chat',
  looking: 'Just looking',
  busy: 'Busy',
  dnd: 'Do not disturb',
};

export type PeepProfile = {
  name: string;
  age: number;
  status: PeepStatus;
  discoverable: boolean;
  updatedAt: string;
};
