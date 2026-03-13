/**
 * Bluetooth Printer Service
 * Uses Web Bluetooth API to connect directly to ESC/POS thermal printers
 */

// Web Bluetooth API types
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
}

interface Navigator {
  bluetooth: {
    requestDevice(options: {
      filters?: Array<{ services: string[] }>;
      optionalServices?: string[];
    }): Promise<BluetoothDevice>;
  };
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

const Commands = {
  // Initialize printer
  INIT: `${ESC}@`,
  
  // Print raster bitmap
  PRINT_RASTER: `${GS}v0`,
  
  // Text alignment
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  
  // Text size (width, height multiplier)
  SIZE_NORMAL: `${GS}!\x00`,
  SIZE_DOUBLE_HEIGHT: `${GS}!\x01`,
  SIZE_DOUBLE_WIDTH: `${GS}!\x10`,
  SIZE_DOUBLE: `${GS}!\x11`,  // Both width and height
  SIZE_TRIPLE: `${GS}!\x22`,
  
  // Text style
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  UNDERLINE_ON: `${ESC}-\x01`,
  UNDERLINE_OFF: `${ESC}-\x00`,
  
  // Line feed
  LINE_FEED: '\n',
  
  // Cut paper (full cut)
  CUT: `${GS}V\x00`,
  
  // Cut paper (partial cut)
  CUT_PARTIAL: `${GS}V\x01`,
};

interface PrinterConnection {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

let printerConnection: PrinterConnection | null = null;

/**
 * Connect to Bluetooth printer
 */
export async function connectPrinter(): Promise<boolean> {
  try {
    // Request ANY Bluetooth device (no filters)
    // This allows the user to select from ALL available devices
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Common ESC/POS service
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip Bluetooth Data Service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART Service
        '0000fff0-0000-1000-8000-00805f9b34fb', // Generic printer service
        '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
      ],
    });

    if (!device.gatt) {
      throw new Error('GATT not available');
    }

    // Connect to GATT server
    const server = await device.gatt.connect();
    
    // Try to find a working service and characteristic
    // Common service UUIDs for thermal printers
    const serviceUUIDs = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '0000fff0-0000-1000-8000-00805f9b34fb',
    ];
    
    // Common characteristic UUIDs for writing
    const characteristicUUIDs = [
      '00002af1-0000-1000-8000-00805f9b34fb',
      '49535343-8841-43f4-a8d4-ecbe34729bb3',
      '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
      '0000fff1-0000-1000-8000-00805f9b34fb',
    ];
    
    let service = null;
    let characteristic = null;
    
    // Try each service UUID
    for (const serviceUUID of serviceUUIDs) {
      try {
        service = await server.getPrimaryService(serviceUUID);
        console.log(`Found service: ${serviceUUID}`);
        
        // Try each characteristic UUID
        for (const charUUID of characteristicUUIDs) {
          try {
            characteristic = await service.getCharacteristic(charUUID);
            console.log(`Found characteristic: ${charUUID}`);
            break;
          } catch (e) {
            // Try next characteristic
          }
        }
        
        if (characteristic) break;
      } catch (e) {
        // Try next service
      }
    }
    
    if (!service || !characteristic) {
      throw new Error('No compatible service/characteristic found');
    }

    printerConnection = { device, characteristic };
    
    // Save device ID to localStorage
    localStorage.setItem('printerDeviceId', device.id);
    
    return true;
  } catch (error) {
    console.error('Failed to connect to printer:', error);
    return false;
  }
}

/**
 * Check if printer is connected
 */
export function isPrinterConnected(): boolean {
  return printerConnection !== null && printerConnection.device.gatt?.connected === true;
}

/**
 * Disconnect printer
 */
export function disconnectPrinter(): void {
  if (printerConnection?.device.gatt?.connected) {
    printerConnection.device.gatt.disconnect();
  }
  printerConnection = null;
  localStorage.removeItem('printerDeviceId');
}

/**
 * Send data to printer
 * Uses smaller chunks and longer delays to prevent buffer overflow
 */
async function sendToPrinter(data: string): Promise<void> {
  if (!printerConnection) {
    throw new Error('Printer not connected');
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  
  // Split into smaller chunks of 256 bytes to avoid buffer overflow
  // Some thermal printers have small buffers and need more time to process
  const chunkSize = 256;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    await printerConnection.characteristic.writeValue(chunk);
    // Longer delay between chunks (100ms) to give printer time to process
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Load image and convert to 1-bit bitmap for thermal printer
 */
async function loadImageAsBitmap(imagePath: string, maxWidth: number = 384): Promise<Uint8Array | null> {
  try {
    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imagePath;
    });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Calculate dimensions (maintain aspect ratio)
    const scale = Math.min(1, maxWidth / img.width);
    canvas.width = Math.floor(img.width * scale);
    canvas.height = Math.floor(img.height * scale);
    
    // Draw image
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Convert to 1-bit bitmap (black and white)
    const width = canvas.width;
    const height = canvas.height;
    const bytesPerLine = Math.ceil(width / 8);
    const bitmap = new Uint8Array(bytesPerLine * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        const a = pixels[pixelIndex + 3];
        
        // Calculate brightness (0-255)
        const brightness = (r + g + b) / 3;
        
        // Threshold: if pixel is dark enough (and not transparent), mark as black
        const isBlack = brightness < 128 && a > 128;
        
        if (isBlack) {
          const byteIndex = y * bytesPerLine + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          bitmap[byteIndex] |= (1 << bitIndex);
        }
      }
    }
    
    // Create ESC/POS raster bitmap command
    // Format: GS v 0 m xL xH yL yH d1...dk
    // m = mode (0 = normal, 1 = double width, 2 = double height, 3 = quadruple)
    const mode = 0;
    const xL = bytesPerLine & 0xFF;
    const xH = (bytesPerLine >> 8) & 0xFF;
    const yL = height & 0xFF;
    const yH = (height >> 8) & 0xFF;
    
    const command = new Uint8Array(8 + bitmap.length);
    command[0] = 0x1D; // GS
    command[1] = 0x76; // v
    command[2] = 0x30; // 0
    command[3] = mode;
    command[4] = xL;
    command[5] = xH;
    command[6] = yL;
    command[7] = yH;
    command.set(bitmap, 8);
    
    return command;
  } catch (error) {
    console.error('Failed to load image as bitmap:', error);
    return null;
  }
}

/**
 * Format price to avoid € symbol (not supported by all printers)
 */
function formatPrice(price: number): string {
  return `${price.toFixed(2)} EUR`;
}

/**
 * Normaliza caracteres especiales que las impresoras térmicas no soportan.
 * Convierte ñ, tildes y otros caracteres latinos a ASCII básico.
 */
function normalizeText(text: string): string {
  return text
    .replace(/á/g, 'a').replace(/Á/g, 'A')
    .replace(/é/g, 'e').replace(/É/g, 'E')
    .replace(/í/g, 'i').replace(/Í/g, 'I')
    .replace(/ó/g, 'o').replace(/Ó/g, 'O')
    .replace(/ú/g, 'u').replace(/Ú/g, 'U')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/¡/g, '!').replace(/¿/g, '?')
    .replace(/€/g, 'EUR');
}

/**
 * Trunca un texto para que quepa en el ancho dado.
 * Si es más largo, añade '...' al final.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Pad string to align text
 */
function padLine(left: string, right: string, width: number = 32): string {
  // Asegurarse de que left no supera el espacio disponible
  const maxLeftLen = width - right.length - 1;
  const safeLeft = truncate(left, maxLeftLen);
  const totalLength = safeLeft.length + right.length;
  const spaces = width - totalLength;
  return safeLeft + ' '.repeat(Math.max(1, spaces)) + right;
}

/**
 * Generate separator line
 */
function separator(char: string = '-', width: number = 32): string {
  return char.repeat(width);
}

/**
 * Agrupa items por nombre+notas+picante para evitar líneas duplicadas.
 */
function groupItems(items: TicketData['items']): TicketData['items'] {
  const grouped = new Map<string, TicketData['items'][0]>();
  for (const item of items) {
    const key = `${item.name}||${item.spiceLevel || ''}||${item.notes || ''}`;
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      grouped.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      grouped.set(key, { ...item });
    }
  }
  return Array.from(grouped.values());
}

export interface TicketData {
  tableId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    spiceLevel?: string;
    notes?: string;
  }>;
  total: number;
  date: Date;
  ticketNumber: number;
}

/**
 * Print ticket
 * Sends data in sections with pauses to prevent buffer overflow
 */
export async function printTicket(data: TicketData): Promise<boolean> {
  try {
    if (!isPrinterConnected()) {
      const connected = await connectPrinter();
      if (!connected) {
        throw new Error('Failed to connect to printer');
      }
    }


    // SECTION 1: Initialize and Header
    let section1 = '';
    section1 += Commands.ALIGN_CENTER;
    section1 += Commands.SIZE_DOUBLE;
    section1 += Commands.BOLD_ON;
    section1 += 'INDIAN CHEF';
    section1 += Commands.LINE_FEED;
    section1 += Commands.SIZE_NORMAL;
    section1 += Commands.BOLD_OFF;
    section1 += Commands.SIZE_NORMAL;
    section1 += 'AJIT & RANJIT, S.L.';
    section1 += Commands.LINE_FEED;
    section1 += Commands.LINE_FEED;
    section1 += separator('=');
    section1 += Commands.LINE_FEED;
    
    await sendToPrinter(section1);
    await new Promise(resolve => setTimeout(resolve, 200)); // Pause between sections
    
    // SECTION 2: Fiscal data and ticket info
    let section2 = '';
    section2 += Commands.ALIGN_LEFT;
    section2 += 'NIF: B24897415';
    section2 += Commands.LINE_FEED;
    section2 += 'C/ Lasauca, 18 Bs';
    section2 += Commands.LINE_FEED;
    section2 += '17600 Figueres (Girona)';
    section2 += Commands.LINE_FEED;
    section2 += separator('-');
    section2 += Commands.LINE_FEED;
    section2 += `Ticket: #${String(data.ticketNumber).padStart(4, '0')}`;
    section2 += Commands.LINE_FEED;
    section2 += `Mesa: ${data.tableId}`;
    section2 += Commands.LINE_FEED;
    section2 += `Fecha: ${data.date.toLocaleDateString('es-ES')} ${data.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    section2 += Commands.LINE_FEED;
    section2 += separator('-');
    section2 += Commands.LINE_FEED;
    
    await sendToPrinter(section2);
    await new Promise(resolve => setTimeout(resolve, 200)); // Pause between sections
    
    // SECTION 3: Items agrupados (send in batches of 3 items to avoid overflow)
    const groupedItems = groupItems(data.items);
    const itemsPerBatch = 3;
    for (let i = 0; i < groupedItems.length; i += itemsPerBatch) {
      let itemsBatch = '';
      const batch = groupedItems.slice(i, i + itemsPerBatch);
      
      for (const item of batch) {
        const normalizedName = normalizeText(item.name);
        const itemName = `${item.quantity}x ${normalizedName}`;
        const itemPrice = formatPrice(item.price * item.quantity);
        itemsBatch += padLine(itemName, itemPrice);
        itemsBatch += Commands.LINE_FEED;
        
        // Spice level and notes (if any)
        if (item.spiceLevel && item.spiceLevel !== 'none') {
          const spiceLabels: Record<string, string> = {
            'mild': 'Picante: -',
            'medium': 'Picante: +-',
            'hot': 'Picante: +',
            'extra_hot': 'Picante: ++'
          };
          itemsBatch += `   ${spiceLabels[item.spiceLevel] || item.spiceLevel}`;
          itemsBatch += Commands.LINE_FEED;
        }
        if (item.notes) {
          // Truncar notas largas para que quepan en el tiquet
          const normalizedNotes = normalizeText(item.notes);
          itemsBatch += `   ${truncate(normalizedNotes, 28)}`;
          itemsBatch += Commands.LINE_FEED;
        }
      }
      
      await sendToPrinter(itemsBatch);
      // Longer pause between item batches (300ms)
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // SECTION 4: Total and footer
    let section4 = '';
    section4 += separator('-');
    section4 += Commands.LINE_FEED;
    section4 += Commands.SIZE_DOUBLE_HEIGHT;
    section4 += Commands.BOLD_ON;
    section4 += padLine('TOTAL:', formatPrice(data.total));
    section4 += Commands.LINE_FEED;
    section4 += Commands.SIZE_NORMAL;
    section4 += Commands.BOLD_OFF;
    section4 += separator('=');
    section4 += Commands.LINE_FEED;
    section4 += Commands.ALIGN_CENTER;
    section4 += Commands.LINE_FEED;
    section4 += 'Gracias por su visita!'; // Sin ¡ para compatibilidad con impresoras
    section4 += Commands.LINE_FEED;
    section4 += Commands.LINE_FEED;
    section4 += Commands.LINE_FEED;
    section4 += Commands.CUT_PARTIAL;
    
    await sendToPrinter(section4);
    
    return true;
  } catch (error) {
    console.error('Failed to print ticket:', error);
    return false;
  }
}

/**
 * Print test ticket
 */
export async function printTestTicket(): Promise<boolean> {
  const testData: TicketData = {
    tableId: 'Test',
    items: [
      { name: 'Palak Paneer', quantity: 1, price: 10.90 },
      { name: 'Butter Chicken', quantity: 1, price: 12.90, spiceLevel: 'medium', notes: 'Extra picante' },
      { name: 'Garlic Naan', quantity: 2, price: 4.90 },
    ],
    total: 33.60,
    date: new Date(),
    ticketNumber: 1,
  };
  
  return await printTicket(testData);
}
