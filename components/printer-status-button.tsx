import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePrinterStore } from '@/store/usePrinterStore';

export function PrinterStatusButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { status, queue, selectedDevice, initPrinter } = usePrinterStore();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    initPrinter();
  }, [initPrinter]);

  const isConnected = status === 'connected' || status === 'printing';
  const color = isConnected ? colors.success : status === 'unsupported' || status === 'error' ? colors.error : colors.warning;

  return (
    <TouchableOpacity
      onPress={() => router.push('/printer')}
      style={[styles.container, { borderColor: color }]}
      accessibilityRole="button"
      accessibilityLabel="Printer setup"
    >
      <IconSymbol name="printer.fill" size={18} color={color} />
      <View>
        <ThemedText style={[styles.label, { color }]}>
          {isConnected ? 'Printer' : 'No printer'}
        </ThemedText>
        <ThemedText style={styles.detail} numberOfLines={1}>
          {queue.length > 0 ? `${queue.length} queued` : selectedDevice?.name ?? 'Setup'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 176,
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  detail: {
    fontSize: 11,
    lineHeight: 13,
  },
});
