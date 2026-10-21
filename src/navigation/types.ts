import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PeepProfile } from '../types/peep';

export type RootStackParamList = {
  Welcome: undefined;
  CreatePeep: { mode: 'create' | 'edit' };
  Main: undefined;
};

export type WelcomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Welcome'
>;
export type CreatePeepScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'CreatePeep'
>;
export type MainScreenProps = NativeStackScreenProps<RootStackParamList, 'Main'>;

export type ProfileContextValue = {
  profile: PeepProfile | null;
  setProfile: (profile: PeepProfile) => void;
  refreshProfile: () => Promise<void>;
  bootstrapping: boolean;
};
