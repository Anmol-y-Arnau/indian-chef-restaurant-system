import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as restaurantDb from "./restaurantDb";
import { generateTicketPDF } from "./ticketPdf";
import { storagePut } from "./storage";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  restaurant: router({
    // Get all tables with their current status
    getTables: publicProcedure.query(async () => {
      return await restaurantDb.getAllTables();
    }),

    // Get all orders across all tables
    getAllOrders: publicProcedure.query(async () => {
      return await restaurantDb.getAllOrders();
    }),

    // Get orders for a specific table
    getTableOrders: publicProcedure
      .input(z.object({ tableId: z.string() }))
      .query(async ({ input }) => {
        return await restaurantDb.getOrdersByTable(input.tableId);
      }),

    // Add an order to a table
    addOrder: publicProcedure
      .input(z.object({
        tableId: z.string(),
        itemId: z.string(),
        itemName: z.string(),
        itemPrice: z.string(), // decimal as string
        quantity: z.number().default(1),
        spiceLevel: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await restaurantDb.addOrder(input);
        await restaurantDb.upsertTable(input.tableId, "occupied");
        return { success: true };
      }),

    // Update order quantity
    updateOrderQuantity: publicProcedure
      .input(z.object({
        orderId: z.number(),
        quantity: z.number(),
      }))
      .mutation(async ({ input }) => {
        await restaurantDb.updateOrderQuantity(input.orderId, input.quantity);
        return { success: true };
      }),

    // Delete an order
    deleteOrder: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        await restaurantDb.deleteOrder(input.orderId);
        return { success: true };
      }),

    // Update order delivery status
    updateOrderDeliveryStatus: publicProcedure
      .input(z.object({
        orderId: z.number(),
        isDelivered: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        console.log('[updateOrderDeliveryStatus] Received:', input);
        try {
          await restaurantDb.updateOrderDeliveryStatus(input.orderId, input.isDelivered);
          console.log('[updateOrderDeliveryStatus] Success');
          return { success: true };
        } catch (error) {
          console.error('[updateOrderDeliveryStatus] Error:', error);
          throw error;
        }
      }),

    // Complete a table (move to sales and clear orders)
    completeTable: publicProcedure
      .input(z.object({
        tableId: z.string(),
        items: z.array(z.any()),
        total: z.string(), // decimal as string
        paymentMethod: z.string().optional(),
        splitBetween: z.number().optional(),
        cashPayers: z.number().optional(),
        cardPayers: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get the oldest order timestamp for this table to use as serviceDate
        const tableOrders = await restaurantDb.getOrdersByTable(input.tableId);
        const oldestOrder = tableOrders.reduce((oldest, order) => {
          if (!oldest || new Date(order.createdAt) < new Date(oldest.createdAt)) {
            return order;
          }
          return oldest;
        }, tableOrders[0]);
        
        const serviceDate = oldestOrder ? new Date(oldestOrder.createdAt) : new Date();
        
        await restaurantDb.addSale({
          tableId: input.tableId,
          items: input.items,
          total: input.total,
          paymentMethod: input.paymentMethod,
          splitBetween: input.splitBetween,
          cashPayers: input.cashPayers,
          cardPayers: input.cardPayers,
          serviceDate, // Use the timestamp of the first order
        });
        await restaurantDb.clearTableOrders(input.tableId);
        await restaurantDb.upsertTable(input.tableId, "free");
        return { success: true };
      }),

    // Get sales history
    getSales: publicProcedure.query(async () => {
      return await restaurantDb.getAllSales();
    }),

    // Update payment method of a closed sale
    updateSalePaymentMethod: publicProcedure
      .input(z.object({
        saleId: z.number(),
        paymentMethod: z.string(),
        splitBetween: z.number().optional(),
        cashPayers: z.number().optional(),
        cardPayers: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await restaurantDb.updateSalePaymentMethod(input.saleId, {
          paymentMethod: input.paymentMethod,
          splitBetween: input.splitBetween,
          cashPayers: input.cashPayers,
          cardPayers: input.cardPayers,
        });
        return { success: true };
      }),

    // Delete a sale
    deleteSale: publicProcedure
      .input(z.object({ saleId: z.number() }))
      .mutation(async ({ input }) => {
        await restaurantDb.deleteSale(input.saleId);
        return { success: true };
      }),

    // Generate PDF ticket for WhatsApp
    generateTicketPDF: publicProcedure
      .input(z.object({
        tableId: z.string(),
        orders: z.array(z.object({
          id: z.number(),
          tableId: z.string(),
          itemId: z.string(),
          itemName: z.string(),
          itemPrice: z.string(),
          quantity: z.number(),
          isDelivered: z.number(),
          spiceLevel: z.string().nullable(),
          notes: z.string().nullable(),
          createdAt: z.date(),
          updatedAt: z.date(),
          menuItem: z.object({
            name: z.string(),
            price: z.number(),
          }),
        })),
        total: z.number(),
        ticketNumber: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Generate PDF
        const pdfBuffer = generateTicketPDF({
          tableId: input.tableId,
          orders: input.orders,
          total: input.total,
          date: new Date(),
          ticketNumber: input.ticketNumber,
        });

        // Upload to S3
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `ticket_${input.tableId}_${timestamp}_${random}.pdf`;
        const { url } = await storagePut(`tickets/${fileName}`, pdfBuffer, 'application/pdf');

        return { url };
      }),

    // Initialize tables (run once on startup)
    initializeTables: publicProcedure
      .input(z.object({ tableIds: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        await restaurantDb.initializeTables(input.tableIds);
        return { success: true };
      }),

    // ========== FREQUENT CUSTOMERS ==========

    // Get all frequent customers
    getFrequentCustomers: publicProcedure.query(async () => {
      return await restaurantDb.getAllFrequentCustomers();
    }),

    // Get a specific customer by ID
    getFrequentCustomer: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await restaurantDb.getFrequentCustomerById(input.id);
      }),

    // Add a new frequent customer
    addFrequentCustomer: publicProcedure
      .input(z.object({
        name: z.string(),
        nif: z.string(),
        address: z.string(),
        city: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await restaurantDb.addFrequentCustomer(input);
      }),

    // Update an existing customer
    updateFrequentCustomer: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        nif: z.string(),
        address: z.string(),
        city: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...customer } = input;
        await restaurantDb.updateFrequentCustomer(id, customer);
        return { success: true };
      }),

    // Delete a customer
    deleteFrequentCustomer: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await restaurantDb.deleteFrequentCustomer(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
