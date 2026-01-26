import { describe, it, expect } from 'vitest';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

describe('Statistics Calculations', () => {
  // Mock sales data for testing
  const mockSales = [
    {
      id: 1,
      tableId: 'test-1',
      items: [
        {
          id: 1,
          menuItem: { id: 'samosa', name: 'Samosa', price: 5.90, category: 'starters' as const, description: '' },
          quantity: 2,
        },
      ],
      total: '11.80',
      paymentMethod: 'cash' as const,
      serviceDate: new Date('2026-01-20T20:00:00Z'),
      createdAt: new Date('2026-01-20T20:00:00Z'),
    },
    {
      id: 2,
      tableId: 'test-2',
      items: [
        {
          id: 2,
          menuItem: { id: 'curry', name: 'Chicken Curry', price: 12.90, category: 'mains' as const, description: '' },
          quantity: 1,
        },
      ],
      total: '12.90',
      paymentMethod: 'card' as const,
      serviceDate: new Date('2026-01-21T19:30:00Z'),
      createdAt: new Date('2026-01-21T19:30:00Z'),
    },
    {
      id: 3,
      tableId: 'test-3',
      items: [
        {
          id: 3,
          menuItem: { id: 'samosa', name: 'Samosa', price: 5.90, category: 'starters' as const, description: '' },
          quantity: 3,
        },
      ],
      total: '17.70',
      paymentMethod: 'cash' as const,
      serviceDate: new Date('2026-01-22T21:00:00Z'),
      createdAt: new Date('2026-01-22T21:00:00Z'),
    },
  ];

  it('should calculate total revenue correctly', () => {
    const totalRevenue = mockSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    
    expect(totalRevenue).toBeCloseTo(42.40, 2); // 11.80 + 12.90 + 17.70
  });

  it('should calculate average ticket correctly', () => {
    const totalRevenue = mockSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    const averageTicket = totalRevenue / mockSales.length;
    
    expect(averageTicket).toBeCloseTo(14.13, 2); // 42.40 / 3
  });

  it('should identify top selling items correctly', () => {
    const itemCounts: Record<string, { name: string; count: number }> = {};

    mockSales.forEach(sale => {
      const items = sale.items as any[];
      items.forEach((item: any) => {
        const key = item.menuItem.name;
        if (!itemCounts[key]) {
          itemCounts[key] = { name: item.menuItem.name, count: 0 };
        }
        itemCounts[key].count += item.quantity;
      });
    });

    const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count);
    
    // Samosa should be #1 with 5 units (2 + 3)
    expect(topItems[0].name).toBe('Samosa');
    expect(topItems[0].count).toBe(5);
    
    // Chicken Curry should be #2 with 1 unit
    expect(topItems[1].name).toBe('Chicken Curry');
    expect(topItems[1].count).toBe(1);
  });

  it('should calculate payment method distribution correctly', () => {
    const cash = mockSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + parseFloat(s.total), 0);

    const card = mockSales
      .filter(s => s.paymentMethod === 'card')
      .reduce((sum, s) => sum + parseFloat(s.total), 0);

    const total = cash + card;
    const cashPercent = (cash / total) * 100;
    const cardPercent = (card / total) * 100;
    
    expect(cash).toBeCloseTo(29.50, 2); // 11.80 + 17.70
    expect(card).toBeCloseTo(12.90, 2);
    expect(cashPercent).toBeCloseTo(69.58, 2);
    expect(cardPercent).toBeCloseTo(30.42, 2);
  });

  it('should filter sales by date range correctly', () => {
    // Filter for week of Jan 20-26, 2026
    const weekStart = startOfWeek(new Date('2026-01-22'), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date('2026-01-22'), { weekStartsOn: 1 });
    
    const weekSales = mockSales.filter(sale => {
      const saleDate = new Date(sale.serviceDate);
      return isWithinInterval(saleDate, { start: weekStart, end: weekEnd });
    });

    // All 3 test sales should be in this week
    expect(weekSales.length).toBe(3);
  });
});
