import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { KitchenTicket, toBase64 } from './escpos';

export type PrinterDevice = {
  name: string;
  address: string;
  paired?: boolean;
};

type BluetoothManagerModule = {
  enableBluetooth?: () => Promise<string[] | string>;
  scanDevices?: () => Promise<string>;
  connect?: (address: string) => Promise<unknown>;
  disconnect?: () => Promise<unknown>;
  pair?: (address: string) => Promise<unknown>;
};

type BluetoothEscposPrinterModule = {
  printRawData?: (base64Data: string) => Promise<unknown>;
  printText?: (text: string, options?: Record<string, unknown>) => Promise<unknown>;
  printerInit?: () => Promise<unknown>;
};

const manager = NativeModules.BluetoothManager as BluetoothManagerModule | undefined;
const printer = NativeModules.BluetoothEscposPrinter as BluetoothEscposPrinterModule | undefined;

export function isBluetoothPrinterSupported() {
  return Boolean(manager?.scanDevices && manager?.connect && printer);
}

async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android') return true;

  const permissions: Parameters<typeof PermissionsAndroid.requestMultiple>[0] = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];

  if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) {
    permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
  }

  if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
    permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
  }

  const results = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(results).every((result) => result === PermissionsAndroid.RESULTS.GRANTED);
}

function normalizeDevice(raw: any, paired = false): PrinterDevice | null {
  const address = raw?.address ?? raw?.macAddress ?? raw?.id;
  if (!address) return null;

  return {
    address,
    name: raw?.name ?? raw?.deviceName ?? 'Thermal Printer',
    paired,
  };
}

function parseDeviceList(value: string) {
  const parsed = JSON.parse(value);
  const paired = Array.isArray(parsed?.paired) ? parsed.paired : [];
  const found = Array.isArray(parsed?.found) ? parsed.found : [];

  return [
    ...paired.map((device: any) => normalizeDevice(device, true)),
    ...found.map((device: any) => normalizeDevice(device, false)),
  ].filter(Boolean) as PrinterDevice[];
}

export async function scanBluetoothPrinters() {
  if (!isBluetoothPrinterSupported() || !manager?.scanDevices) {
    throw new Error('Bluetooth ESC/POS module is not installed in this app build.');
  }

  const granted = await requestBluetoothPermissions();
  if (!granted) {
    throw new Error('Bluetooth permission was denied.');
  }

  await manager.enableBluetooth?.();
  const result = await manager.scanDevices();
  const devices = parseDeviceList(result);
  const uniqueDevices = new Map(devices.map((device) => [device.address, device]));

  return [...uniqueDevices.values()];
}

export async function connectBluetoothPrinter(address: string) {
  if (!isBluetoothPrinterSupported() || !manager?.connect) {
    throw new Error('Bluetooth ESC/POS module is not installed in this app build.');
  }

  const granted = await requestBluetoothPermissions();
  if (!granted) {
    throw new Error('Bluetooth permission was denied.');
  }

  await manager.pair?.(address).catch(() => undefined);
  await manager.connect(address);
}

export async function disconnectBluetoothPrinter() {
  await manager?.disconnect?.();
}

export async function printEscPosTicket(ticket: KitchenTicket) {
  if (!printer) {
    throw new Error('Bluetooth ESC/POS printer module is not available.');
  }

  if (printer.printRawData) {
    await printer.printRawData(toBase64(ticket.bytes));
    return;
  }

  await printer.printerInit?.();
  if (!printer.printText) {
    throw new Error('This printer module does not expose raw or text printing.');
  }

  await printer.printText(ticket.text, {
    encoding: 'GBK',
    codepage: 0,
    widthtimes: 0,
    heigthtimes: 0,
    fonttype: 0,
  });
}
