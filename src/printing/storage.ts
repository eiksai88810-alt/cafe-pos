import { NativeModules } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type NativeAsyncStorage = {
  multiGet: (
    keys: string[],
    callback: (errors?: unknown, result?: [string, string | null][]) => void
  ) => void;
  multiSet: (
    keyValuePairs: [string, string][],
    callback?: (errors?: unknown) => void
  ) => void;
  multiRemove: (keys: string[], callback?: (errors?: unknown) => void) => void;
};

const nativeAsyncStorage = (
  NativeModules.RNCAsyncStorage ??
  NativeModules.AsyncSQLiteDBStorage ??
  NativeModules.AsyncLocalStorage
) as NativeAsyncStorage | undefined;

function rejectIfNativeErrors(errors: unknown) {
  if (!errors) return;
  throw new Error(Array.isArray(errors) ? JSON.stringify(errors) : String(errors));
}

export const printerStorage = {
  async getItem(key: string) {
    if (nativeAsyncStorage?.multiGet) {
      return new Promise<string | null>((resolve, reject) => {
        nativeAsyncStorage.multiGet([key], (errors, result) => {
          try {
            rejectIfNativeErrors(errors);
            resolve(result?.[0]?.[1] ?? null);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string) {
    if (nativeAsyncStorage?.multiSet) {
      return new Promise<void>((resolve, reject) => {
        nativeAsyncStorage.multiSet([[key, value]], (errors) => {
          try {
            rejectIfNativeErrors(errors);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string) {
    if (nativeAsyncStorage?.multiRemove) {
      return new Promise<void>((resolve, reject) => {
        nativeAsyncStorage.multiRemove([key], (errors) => {
          try {
            rejectIfNativeErrors(errors);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    await SecureStore.deleteItemAsync(key);
  },
};
