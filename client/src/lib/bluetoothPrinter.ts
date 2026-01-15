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
 */
async function sendToPrinter(data: string): Promise<void> {
  if (!printerConnection) {
    throw new Error('Printer not connected');
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  
  // Split into chunks of 512 bytes (Bluetooth limitation)
  const chunkSize = 512;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    await printerConnection.characteristic.writeValue(chunk);
    // Small delay between chunks
    await new Promise(resolve => setTimeout(resolve, 50));
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
 */
export async function printTicket(data: TicketData): Promise<boolean> {
  try {
    if (!isPrinterConnected()) {
      const connected = await connectPrinter();
      if (!connected) {
        throw new Error('Failed to connect to printer');
      }
    }

    let ticket = '';
    
    // Initialize printer
    ticket += Commands.INIT;
    
    // Header - Company name (large, centered, bold)
    ticket += Commands.ALIGN_CENTER;
    ticket += Commands.SIZE_DOUBLE;
    ticket += Commands.BOLD_ON;
    ticket += 'INDIAN CHEF';
    ticket += Commands.LINE_FEED;
    ticket += Commands.SIZE_NORMAL;
    ticket += Commands.BOLD_OFF;
    
    // Company legal name
    ticket += Commands.SIZE_NORMAL;
    ticket += 'AJIT & RANJIT, S.L.';
    ticket += Commands.LINE_FEED;
    ticket += Commands.LINE_FEED;
    
    // Separator
    ticket += separator('=');
    ticket += Commands.LINE_FEED;
    
    // Fiscal data (left aligned, normal size)
    ticket += Commands.ALIGN_LEFT;
    ticket += 'NIF: B24897415';
    ticket += Commands.LINE_FEED;
    ticket += 'C/ Lasauca, 18 Bs';
    ticket += Commands.LINE_FEED;
    ticket += '17600 Figueres (Girona)';
    ticket += Commands.LINE_FEED;
    
    // Separator
    ticket += separator('-');
    ticket += Commands.LINE_FEED;
    
    // Ticket info
    ticket += `Ticket: #${String(data.ticketNumber).padStart(4, '0')}`;
    ticket += Commands.LINE_FEED;
    ticket += `Mesa: ${data.tableId}`;
    ticket += Commands.LINE_FEED;
    ticket += `Fecha: ${data.date.toLocaleDateString('es-ES')} ${data.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    ticket += Commands.LINE_FEED;
    
    // Separator
    ticket += separator('-');
    ticket += Commands.LINE_FEED;
    
    // Items
    for (const item of data.items) {
      const itemName = `${item.quantity}x ${item.name}`;
      const itemPrice = formatPrice(item.price * item.quantity);
      ticket += padLine(itemName, itemPrice);
      ticket += Commands.LINE_FEED;
      
      // Spice level and notes (if any)
      if (item.spiceLevel && item.spiceLevel !== 'none') {
        ticket += `   Picante: ${item.spiceLevel}`;
        ticket += Commands.LINE_FEED;
      }
      if (item.notes) {
        ticket += `   ${item.notes}`;
        ticket += Commands.LINE_FEED;
      }
    }
    
    // Separator
    ticket += separator('-');
    ticket += Commands.LINE_FEED;
    
    // Total (bold, larger)
    ticket += Commands.SIZE_DOUBLE_HEIGHT;
    ticket += Commands.BOLD_ON;
    ticket += padLine('TOTAL:', formatPrice(data.total));
    ticket += Commands.LINE_FEED;
    ticket += Commands.SIZE_NORMAL;
    ticket += Commands.BOLD_OFF;
    
    // Separator
    ticket += separator('=');
    ticket += Commands.LINE_FEED;
    
    // Footer message (centered)
    ticket += Commands.ALIGN_CENTER;
    ticket += Commands.LINE_FEED;
    ticket += 'Gracias por su visita!';
    ticket += Commands.LINE_FEED;
    ticket += Commands.LINE_FEED;
    ticket += Commands.LINE_FEED;
    
    // Cut paper
    ticket += Commands.CUT_PARTIAL;
    
    // Send to printer
    await sendToPrinter(ticket);
    
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
