import { Order } from '@/types';

export type PaperWidth = '58mm' | '80mm';

export type KitchenTicket = {
  text: string;
  bytes: number[];
};

const WIDTH_CHARS: Record<PaperWidth, number> = {
  '58mm': 32,
  '80mm': 48,
};

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function cleanText(value: string) {
  return value.replace(/[^\x20-\x7E\n]/g, '?');
}

function encode(value: string) {
  return [...cleanText(value)].map((char) => char.charCodeAt(0));
}

function center(value: string, width: number) {
  const text = cleanText(value).trim();
  if (text.length >= width) return text;
  const padding = Math.floor((width - text.length) / 2);
  return `${' '.repeat(padding)}${text}`;
}

function divider(width: number) {
  return '-'.repeat(width);
}

function orderNumber(orderId: string) {
  return orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
}

export function formatKitchenTicketText(order: Order, waiterName: string, paperWidth: PaperWidth) {
  const width = WIDTH_CHARS[paperWidth];
  const time = new Date(order.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    'KITCHEN ORDER',
    `Table: ${order.tableId} | Order #${orderNumber(order.id)}`,
    `Waiter: ${waiterName || 'Unknown'}`,
    `Time: ${time}`,
    '',
    ...order.items.flatMap((item) => {
      const rows = [`${item.quantity}x ${item.name}`];
      if (item.specialInstructions?.trim()) {
        rows.push(`Note: ${item.specialInstructions.trim()}`);
      }
      rows.push('');
      return rows;
    }),
    divider(width),
    '',
  ];

  return lines.join('\n');
}

export function buildKitchenTicket(order: Order, waiterName: string, paperWidth: PaperWidth): KitchenTicket {
  const width = WIDTH_CHARS[paperWidth];
  const body = formatKitchenTicketText(order, waiterName, paperWidth);
  const [, ...bodyLines] = body.split('\n');

  const bytes = [
    ESC,
    0x40,
    ESC,
    0x61,
    0x01,
    GS,
    0x21,
    0x11,
    ...encode(center('KITCHEN ORDER', width)),
    LF,
    GS,
    0x21,
    0x00,
    ESC,
    0x61,
    0x00,
    ...encode(bodyLines.join('\n')),
    LF,
    LF,
    GS,
    0x56,
    0x00,
  ];

  return {
    text: body,
    bytes,
  };
}

export function toBase64(bytes: number[]) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const triplet = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    output += alphabet[(triplet >> 18) & 0x3f];
    output += alphabet[(triplet >> 12) & 0x3f];
    output += second === undefined ? '=' : alphabet[(triplet >> 6) & 0x3f];
    output += third === undefined ? '=' : alphabet[triplet & 0x3f];
  }

  return output;
}
