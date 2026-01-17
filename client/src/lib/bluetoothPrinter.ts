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
 * Format price to avoid € symbol (not supported by all printers)
 */
function formatPrice(price: number): string {
  return `${price.toFixed(2)} EUR`;
}

/**
 * Pad string to align text
 */
function padLine(left: string, right: string, width: number = 32): string {
  const totalLength = left.length + right.length;
  const spaces = width - totalLength;
  return left + ' '.repeat(Math.max(0, spaces)) + right;
}

/**
 * Generate separator line
 */
function separator(char: string = '-', width: number = 32): string {
  return char.repeat(width);
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
    section1 += Commands.INIT;
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
    
    // SECTION 3: Items (send in batches of 3 items to avoid overflow)
    const itemsPerBatch = 3;
    for (let i = 0; i < data.items.length; i += itemsPerBatch) {
      let itemsBatch = '';
      const batch = data.items.slice(i, i + itemsPerBatch);
      
      for (const item of batch) {
        const itemName = `${item.quantity}x ${item.name}`;
        const itemPrice = formatPrice(item.price * item.quantity);
        itemsBatch += padLine(itemName, itemPrice);
        itemsBatch += Commands.LINE_FEED;
        
        // Spice level and notes (if any)
        if (item.spiceLevel && item.spiceLevel !== 'none') {
          itemsBatch += `   Picante: ${item.spiceLevel}`;
          itemsBatch += Commands.LINE_FEED;
        }
        if (item.notes) {
          itemsBatch += `   ${item.notes}`;
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
    section4 += 'Gracias por su visita!';
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
