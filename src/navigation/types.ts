import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Camera: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  CreatePeep: { mode: 'create' | 'edit' };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
};

export type WelcomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Welcome'
>;
export type CreatePeepScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'CreatePeep'
>;

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type DiscoverScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type CameraScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Camera'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type SettingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;
