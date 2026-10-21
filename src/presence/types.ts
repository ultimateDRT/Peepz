import type { PeepStatus } from '../types/peep';

export type DiscoveryUser = {
  deviceId: string;
  name: string;
  age: number;
  status: PeepStatus;
};

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'disconnected';

export type PresenceJoinPayload = {
  roomCode: string;
  deviceId: string;
  name: string;
  age: number;
  status: PeepStatus;
  discoverable: boolean;
};

export type PresenceUpdatePayload = {
  roomCode?: string;
  deviceId?: string;
  name?: string;
  age?: number;
  status?: PeepStatus;
  discoverable?: boolean;
};
