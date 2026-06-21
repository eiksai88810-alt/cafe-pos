import { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useStore();
  const colorScheme = useColorScheme();
  
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedPin = await SecureStore.getItemAsync('userPin');
        if (storedPin) {
          const success = await login(storedPin);
          if (success) {
            router.replace('/(tabs)/tables');
          } else {
            await SecureStore.deleteItemAsync('userPin');
          }
        }
      } catch (error) {
        console.error('Failed to check login status:', error);
      }
    };

    checkLoginStatus();
  }, [login, router]);

  const handlePinChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, '');
    setPin(numbersOnly.slice(0, 4));
    setError(null);
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const success = await login(pin);
      if (success) {
        await SecureStore.setItemAsync('userPin', pin);
        router.replace('/(tabs)/tables');
      } else {
        setError('Invalid PIN');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Waiter POS
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Please enter your 4-digit PIN to continue
        </ThemedText>
        
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>
            PIN Entry
          </ThemedText>
          
          <ThemedView style={styles.pinDots}>
            {[0, 1, 2, 3].map((index) => (
              <View key={index} style={[
                styles.pinDot,
                index < pin.length && styles.pinDotFilled
              ]} />
            ))}
          </ThemedView>
          
          <TextInput
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry={true}
            style={styles.pinInput}
            placeholder="____"
            placeholderTextColor={Colors[colorScheme ?? 'light'].border || '#ccc'}
          />
          
          {error && (
            <ThemedText style={styles.errorText}>
              {error}
            </ThemedText>
          )}
          
          <TouchableOpacity 
            onPress={handleLogin}
            style={[
              styles.loginButton,
              pin.length !== 4 && styles.loginButtonDisabled
            ]}
          >
            <ThemedText style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  cardTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pinDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  pinDotFilled: {
  },
  pinInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 24,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
