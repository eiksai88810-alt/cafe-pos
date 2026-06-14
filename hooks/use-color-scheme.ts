import { useColorScheme as useDeviceColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const scheme = useDeviceColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
