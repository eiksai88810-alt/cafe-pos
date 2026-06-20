import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { User } from '@/types';

type WaiterLoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getDevelopmentHost() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : null;

  if (host) {
    return host;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

function getAdminApiBaseUrl() {
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() ??
    process.env.API_URL?.trim() ??
    process.env.EXPO_PUBLIC_API_URL_?.trim() ??
    process.env.API_URL_?.trim() ??
    process.env.EXPO_PUBLIC_POS_ADMIN_API_URL?.trim() ??
    process.env['API-URL_']?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return `http://${getDevelopmentHost()}:3000`;
}

function mapRole(role: string): User['role'] {
  return role === 'WAITER' ? 'waiter' : 'admin';
}

export async function loginWaiterWithPin(pin: string): Promise<{ token: string; user: User }> {
  const normalizedPin = pin.replace(/\D/g, '').slice(0, 4);

  const response = await fetch(`${getAdminApiBaseUrl()}/api/waiter/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin: normalizedPin }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message ?? 'Login failed', response.status);
  }

  const loginData = data as WaiterLoginResponse;

  return {
    token: loginData.token,
    user: {
      id: loginData.user.id,
      name: loginData.user.name,
      role: mapRole(loginData.user.role),
    },
  };
}
