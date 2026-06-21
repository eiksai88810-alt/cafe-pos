import { useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PaperWidth } from '@/printing/escpos';
import { PrinterDevice } from '@/printing/bluetoothPrinter';
import { usePrinterStore } from '@/store/usePrinterStore';

export default function PrinterSetupScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    initPrinter,
    status,
    error,
    devices,
    selectedDevice,
    paperWidth,
    queue,
    scanPrinters,
    connectPrinter,
    disconnectPrinter,
    setPaperWidth,
    retryQueue,
    skipQueuedJob,
    clearPrintQueue,
  } = usePrinterStore();

  useEffect(() => {
    initPrinter();
  }, [initPrinter]);

  const isBusy = status === 'scanning' || status === 'connecting' || status === 'printing';

  const handleConnect = async (device: PrinterDevice) => {
    await connectPrinter(device);
  };

  const handleClearQueue = () => {
    Alert.alert('Skip queued tickets?', 'Kitchen tickets will remain available in the dashboard only.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip Printing', style: 'destructive', onPress: clearPrintQueue },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Kitchen Printer</ThemedText>
          <ThemedText style={styles.subtitle}>Bluetooth ESC/POS thermal printer</ThemedText>
        </View>
        <View style={[styles.statusPill, { borderColor: getStatusColor(status, colors) }]}>
          <IconSymbol name="printer.fill" size={16} color={getStatusColor(status, colors)} />
          <ThemedText style={[styles.statusText, { color: getStatusColor(status, colors) }]}>
            {status}
          </ThemedText>
        </View>
      </View>

      {error && (
        <ThemedView style={[styles.notice, { borderColor: colors.error }]}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.error }}>
            {error}
          </ThemedText>
          <ThemedText style={styles.noticeBody}>
            A dev-client build with a Bluetooth ESC/POS library (e.g. react-native-esc-pos-printer) is required for printing.
          </ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Saved Printer</ThemedText>
        {selectedDevice ? (
          <View style={styles.savedPrinterRow}>
            <View>
              <ThemedText type="defaultSemiBold">{selectedDevice.name}</ThemedText>
              <ThemedText>{selectedDevice.address}</ThemedText>
            </View>
            <TouchableOpacity onPress={disconnectPrinter} style={[styles.secondaryButton, { borderColor: colors.border }]}>
              <ThemedText type="defaultSemiBold">Disconnect</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <ThemedText>No printer saved yet.</ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Paper Width</ThemedText>
        <View style={styles.segment}>
          {(['58mm', '80mm'] as PaperWidth[]).map((width) => {
            const active = paperWidth === width;
            return (
              <TouchableOpacity
                key={width}
                onPress={() => setPaperWidth(width)}
                style={[styles.segmentButton, active && { backgroundColor: colors.tint }]}
              >
                <ThemedText style={[styles.segmentText, active && { color: colors.background }]}>
                  {width}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </ThemedView>

      <View style={styles.scanRow}>
        <ThemedText type="subtitle">Bluetooth Devices</ThemedText>
        <TouchableOpacity disabled={isBusy} onPress={scanPrinters} style={[styles.primaryButton, isBusy && styles.disabled]}>
          {isBusy ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <IconSymbol name="antenna.radiowaves.left.and.right" size={18} color={colors.background} />
          )}
          <ThemedText style={[styles.primaryButtonText, { color: colors.background }]}>Scan</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleConnect(item)} style={[styles.deviceRow, { borderColor: colors.border }]}>
            <View>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText>{item.address}</ThemedText>
            </View>
            <ThemedText style={{ color: item.paired ? colors.success : colors.tint }}>
              {item.paired ? 'Save' : 'Pair & Save'}
            </ThemedText>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<ThemedText style={styles.emptyText}>Scan for paired or nearby kitchen printers.</ThemedText>}
        ListFooterComponent={
          <ThemedView style={styles.queueSection}>
            <View style={styles.queueHeader}>
              <View>
                <ThemedText type="subtitle">Print Queue</ThemedText>
                <ThemedText>{queue.length} pending ticket{queue.length === 1 ? '' : 's'}</ThemedText>
              </View>
              <View style={styles.queueActions}>
                <TouchableOpacity disabled={queue.length === 0 || isBusy} onPress={retryQueue} style={[styles.secondaryButton, { borderColor: colors.border }]}>
                  <ThemedText type="defaultSemiBold">Retry</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity disabled={queue.length === 0} onPress={handleClearQueue} style={[styles.secondaryButton, { borderColor: colors.border }]}>
                  <ThemedText type="defaultSemiBold">Skip</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            {queue.map((job) => (
              <View key={job.id} style={[styles.queueItem, { borderColor: colors.border }]}>
                <View style={styles.queueItemBody}>
                  <ThemedText type="defaultSemiBold">
                    Table {job.order.tableId} | Order #{job.order.id.slice(-8).toUpperCase()}
                  </ThemedText>
                  <ThemedText>
                    {job.order.items.reduce((total, item) => total + item.quantity, 0)} item(s) | attempts {job.attempts}
                  </ThemedText>
                  {job.lastError && <ThemedText style={{ color: colors.error }}>{job.lastError}</ThemedText>}
                </View>
                <TouchableOpacity onPress={() => skipQueuedJob(job.id)} style={styles.skipJobButton}>
                  <IconSymbol name="trash.fill" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ThemedView>
        }
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

function getStatusColor(status: string, colors: typeof Colors['light']) {
  if (status === 'connected' || status === 'printing') return colors.success;
  if (status === 'error' || status === 'unsupported') return colors.error;
  return colors.warning;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    textTransform: 'capitalize',
    fontWeight: '700',
  },
  notice: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noticeBody: {
    marginTop: 6,
  },
  card: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  savedPrinterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  segmentText: {
    fontWeight: '700',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  queueSection: {
    marginTop: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  queueActions: {
    flexDirection: 'row',
    gap: 8,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  queueItemBody: {
    flex: 1,
  },
  skipJobButton: {
    padding: 8,
  },
});
