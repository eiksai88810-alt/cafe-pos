import { useEffect, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Switch, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import * as SecureStore from 'expo-secure-store';

export default function AccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user, logout } = useStore();
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const autoLogoutStr = await SecureStore.getItemAsync('autoLogoutEnabled');
        setAutoLogoutEnabled(autoLogoutStr === 'true');
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleToggleAutoLogout = async (value: boolean) => {
    setAutoLogoutEnabled(value);
    try {
      await SecureStore.setItemAsync('autoLogoutEnabled', value.toString());
    } catch (error) {
      console.error('Failed to save settings:', error);
      setAutoLogoutEnabled(!value);
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('autoLogoutEnabled');
      await SecureStore.deleteItemAsync('userPin');
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
    logout();
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText type="default" style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Please log in to access your account</ThemedText>
        <TouchableOpacity
          onPress={() => router.replace('/auth/login')}
          style={styles.loginButton}
        >
          <ThemedText style={styles.loginButtonText}>
            Log In
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Account Settings
      </ThemedText>
      
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Profile Information</ThemedText>
        <View style={styles.profileRow}>
          <IconSymbol name="person.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.profileText}>
            {user.name}
          </ThemedText>
        </View>
        <View style={styles.profileRow}>
          <IconSymbol name="key.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.profileText}>
            PIN Set
          </ThemedText>
        </View>
        <View style={styles.profileRow}>
          <IconSymbol name="calendar.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.profileText}>
            Role: {user.role === 'waiter' ? 'Waiter' : 'Administrator'}
          </ThemedText>
        </View>
      </ThemedView>
      
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Preferences</ThemedText>
        <View style={styles.preferenceRow}>
          <ThemedText>Auto-logout after 8 hours</ThemedText>
          <Switch
            value={autoLogoutEnabled}
            onValueChange={handleToggleAutoLogout}
            thumbColor={Colors[colorScheme ?? 'light'].tint}
            trackColor={{ 
              false: Colors[colorScheme ?? 'light'].border,
              true: Colors[colorScheme ?? 'light'].success 
            }}
          />
        </View>
      </ThemedView>
      
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Session</ThemedText>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <View style={styles.logoutButtonContent}>
            <IconSymbol name="rectangle.portrait.and.arrow.forward" size={20} color={Colors[colorScheme ?? 'light'].error} />
            <ThemedText style={styles.logoutButtonText}>
              Log Out
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme ?? 'light'].border} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  profileText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  loginButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    marginLeft: 8,
  },
});
