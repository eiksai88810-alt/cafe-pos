import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { Order } from '@/types';
import { buildKitchenTicket, PaperWidth } from '@/printing/escpos';
import {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  isBluetoothPrinterSupported,
  PrinterDevice,
  printEscPosTicket,
  scanBluetoothPrinters,
} from '@/printing/bluetoothPrinter';
import { printerStorage } from '@/printing/storage';

type PrinterStatus = 'idle' | 'unsupported' | 'scanning' | 'connecting' | 'connected' | 'disconnected' | 'printing' | 'error';

export type PrintJob = {
  id: string;
  order: Order;
  waiterName: string;
  paperWidth: PaperWidth;
  attempts: number;
  createdAt: string;
  lastError?: string;
};

type PrintResult =
  | { status: 'printed' }
  | { status: 'queued'; jobId: string; message: string }
  | { status: 'failed'; message: string };

type PrinterSettings = {
  device: PrinterDevice | null;
  paperWidth: PaperWidth;
};

type PrinterState = {
  initialized: boolean;
  status: PrinterStatus;
  error: string | null;
  devices: PrinterDevice[];
  selectedDevice: PrinterDevice | null;
  paperWidth: PaperWidth;
  queue: PrintJob[];
  initPrinter: () => Promise<void>;
  setPaperWidth: (paperWidth: PaperWidth) => Promise<void>;
  scanPrinters: () => Promise<void>;
  connectPrinter: (device: PrinterDevice) => Promise<void>;
  disconnectPrinter: () => Promise<void>;
  printOrder: (order: Order, waiterName: string) => Promise<PrintResult>;
  retryQueue: () => Promise<void>;
  skipQueuedJob: (jobId: string) => Promise<void>;
  clearPrintQueue: () => Promise<void>;
};

const SETTINGS_KEY = 'waiter-printer-settings';
const QUEUE_KEY = 'waiter-printer-queue';

function newJob(order: Order, waiterName: string, paperWidth: PaperWidth): PrintJob {
  return {
    id: `${order.id}-${Date.now()}`,
    order,
    waiterName,
    paperWidth,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
}

async function loadJson<T>(key: string, fallback: T) {
  const value = await printerStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function saveSettings(settings: PrinterSettings) {
  await printerStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function saveQueue(queue: PrintJob[]) {
  await printerStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const usePrinterStore = create<PrinterState>((set, get) => ({
  initialized: false,
  status: 'idle',
  error: null,
  devices: [],
  selectedDevice: null,
  paperWidth: '58mm',
  queue: [],

  initPrinter: async () => {
    if (get().initialized) return;

    const [settings, queue] = await Promise.all([
      loadJson<PrinterSettings>(SETTINGS_KEY, { device: null, paperWidth: '58mm' }),
      loadJson<PrintJob[]>(QUEUE_KEY, []),
    ]);

    set({
      initialized: true,
      selectedDevice: settings.device,
      paperWidth: settings.paperWidth ?? '58mm',
      queue,
      status: isBluetoothPrinterSupported() ? 'disconnected' : 'unsupported',
      error: isBluetoothPrinterSupported() ? null : 'Bluetooth printer module not available in this build.',
    });
  },

  setPaperWidth: async (paperWidth) => {
    const selectedDevice = get().selectedDevice;
    set({ paperWidth });
    await saveSettings({ device: selectedDevice, paperWidth });
  },

  scanPrinters: async () => {
    set({ status: 'scanning', error: null });

    try {
      const devices = await scanBluetoothPrinters();
      set({ devices, status: 'disconnected' });
    } catch (error) {
      set({
        status: isBluetoothPrinterSupported() ? 'error' : 'unsupported',
        error: error instanceof Error ? error.message : 'Unable to scan for printers.',
      });
    }
  },

  connectPrinter: async (device) => {
    set({ status: 'connecting', error: null });

    try {
      await connectBluetoothPrinter(device.address);
      const paperWidth = get().paperWidth;
      set({ selectedDevice: device, status: 'connected' });
      await saveSettings({ device, paperWidth });
      await get().retryQueue();
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unable to connect to printer.',
      });
    }
  },

  disconnectPrinter: async () => {
    await disconnectBluetoothPrinter();
    set({ status: 'disconnected' });
  },

  printOrder: async (order, waiterName) => {
    const state = get();
    const job = newJob(order, waiterName, state.paperWidth);

    if (!state.selectedDevice) {
      const queue = [...state.queue, job];
      set({ queue, status: isBluetoothPrinterSupported() ? 'disconnected' : 'unsupported' });
      await saveQueue(queue);
      return { status: 'queued', jobId: job.id, message: 'No kitchen printer is connected.' };
    }

    try {
      set({ status: 'printing', error: null });
      await connectBluetoothPrinter(state.selectedDevice.address);
      await printEscPosTicket(buildKitchenTicket(order, waiterName, state.paperWidth));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      set({ status: 'connected' });
      return { status: 'printed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to print kitchen ticket.';
      const queue = [...state.queue, { ...job, attempts: 1, lastError: message }];
      set({ queue, status: 'error', error: message });
      await saveQueue(queue);
      return { status: 'queued', jobId: job.id, message };
    }
  },

  retryQueue: async () => {
    const { selectedDevice } = get();
    if (!selectedDevice || get().queue.length === 0) return;

    const pending = [...get().queue];
    const failed: PrintJob[] = [];
    set({ status: 'printing', error: null });

    for (const job of pending) {
      try {
        await connectBluetoothPrinter(selectedDevice.address);
        await printEscPosTicket(buildKitchenTicket(job.order, job.waiterName, job.paperWidth));
      } catch (error) {
        failed.push({
          ...job,
          attempts: job.attempts + 1,
          lastError: error instanceof Error ? error.message : 'Unable to print queued ticket.',
        });
      }
    }

    await saveQueue(failed);
    set({
      queue: failed,
      status: failed.length > 0 ? 'error' : 'connected',
      error: failed.length > 0 ? failed[0].lastError ?? 'Some print jobs are still queued.' : null,
    });

    if (failed.length === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  skipQueuedJob: async (jobId) => {
    const queue = get().queue.filter((job) => job.id !== jobId);
    set({ queue });
    await saveQueue(queue);
  },

  clearPrintQueue: async () => {
    set({ queue: [] });
    await saveQueue([]);
  },
}));
