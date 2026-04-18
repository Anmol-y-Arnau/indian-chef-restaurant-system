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

    // Get only orders from currently occupied tables (no orphaned/old orders)
    getActiveOrders: publicProcedure.query(async () => {
      return await restaurantDb.getActiveOrders();
    }),

    // Clean orphaned orders (orders from tables that are no longer occupied)
    cleanOrphanedOrders: publicProcedure.mutation(async () => {
      const deleted = await restaurantDb.cleanOrphanedOrders();
      return { deleted };
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
        // Si es un plato personalizado (Varios), registrar para detección de frecuentes
        if (input.itemId.startsWith('custom-') && input.itemName && input.itemName !== 'Varios') {
          await restaurantDb.logCustomItem(input.itemName).catch(() => {}); // No bloquear si falla
        }
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

    // Batch update delivery status (mark multiple orders at once)
    batchUpdateDeliveryStatus: publicProcedure
      .input(z.object({
        orderIds: z.array(z.number()),
        isDelivered: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        console.log('[batchUpdateDeliveryStatus] Received:', input.orderIds.length, 'orders');
        try {
          await restaurantDb.updateOrderDeliveryStatusBatch(input.orderIds, input.isDelivered);
          console.log('[batchUpdateDeliveryStatus] Success');
          return { success: true };
        } catch (error) {
          console.error('[batchUpdateDeliveryStatus] Error:', error);
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
        email: z.string().optional(),
        phone: z.string().optional(),
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
        email: z.string().optional(),
        phone: z.string().optional(),
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

    // ========== INVOICES ==========

    // Create an invoice
    createInvoice: publicProcedure
      .input(z.object({
        customerId: z.number(),
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        subtotal: z.number(),
        taxRate: z.number().default(10),
        taxAmount: z.number(),
        total: z.number(),
        tableId: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get customer data for snapshot
        const customer = await restaurantDb.getFrequentCustomerById(input.customerId);
        if (!customer) throw new Error('Customer not found');
        
        const invoice = await restaurantDb.createInvoice({
          customerId: input.customerId,
          customerSnapshot: customer,
          items: input.items,
          subtotal: input.subtotal.toFixed(2),
          taxRate: input.taxRate.toFixed(2),
          taxAmount: input.taxAmount.toFixed(2),
          total: input.total.toFixed(2),
          tableId: input.tableId,
          notes: input.notes,
        });
        return invoice;
      }),

    // Get invoices for a specific customer
    getInvoicesByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return await restaurantDb.getInvoicesByCustomer(input.customerId);
      }),

    // Get all invoices
    getAllInvoices: publicProcedure.query(async () => {
      return await restaurantDb.getAllInvoices();
    }),

    // Get a single invoice by ID
    getInvoice: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await restaurantDb.getInvoiceById(input.id);
      }),

    // Generate PDF for an invoice and upload to S3
    generateInvoicePDF: publicProcedure
      .input(z.object({
        invoiceNumber: z.string(),
        customer: z.object({
          name: z.string(),
          nif: z.string(),
          address: z.string(),
          city: z.string(),
          email: z.string().optional().nullable(),
          phone: z.string().optional().nullable(),
        }),
        items: z.array(z.object({
          name: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        subtotal: z.number(),
        taxRate: z.number(),
        taxAmount: z.number(),
        total: z.number(),
        tableId: z.string().optional(),
        notes: z.string().optional(),
        createdAt: z.date().optional(),
        restaurantName: z.string().optional(),
        restaurantAddress: z.string().optional(),
        restaurantNif: z.string().optional(),
        restaurantPhone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateInvoicePDF } = await import('./invoicePdf');
        const pdfBuffer = generateInvoicePDF(input);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `invoices/${input.invoiceNumber}_${timestamp}_${random}.pdf`;
        const { url } = await storagePut(fileName, pdfBuffer, 'application/pdf');
        return { url };
      }),

    // ========== IA - PARSE ORDER FROM FREE TEXT ==========
    parseOrderWithAI: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(2000),
        menuCatalog: z.array(z.object({
          id: z.string(),
          number: z.number().optional(),
          name: z.string(),
          price: z.number(),
          category: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        const catalogText = input.menuCatalog
          .map(item => `- id:${item.id} | número:${item.number ?? '-'} | nombre:"${item.name}" | precio:${item.price}€ | categoría:${item.category}`)
          .join('\n');

        const systemPrompt = `Eres un asistente de restaurante indio. Tu tarea es interpretar el texto libre que escribe un camarero y convertirlo en una lista de pedidos.

Catálogo del menú:
${catalogText}

Reglas:
1. Identifica cada plato mencionado y búscalo en el catálogo por nombre (búsqueda flexible, ignora mayúsculas, tildes y pequeños errores ortográficos)
2. Si el camarero escribe un número de plato (ej: "el 25", "número 12"), úsalo para identificar el plato
3. Extrae la cantidad (si no se especifica, asume 1)
4. Si hay nivel de picante mencionado (sin picante, poco, normal, picante, muy picante), inclúyeloresponde SOLO con JSON válido, sin texto adicional, sin markdown, sin bloques de código.`;

        const userPrompt = `Texto del camarero: "${input.text}"

Responde con este JSON exacto:
{
  "items": [
    {
      "itemId": "string (id del catálogo)",
      "itemName": "string (nombre del plato)",
      "quantity": number,
      "spiceLevel": "string o null (-, +-, +, ++)",
      "confidence": "high|medium|low",
      "originalText": "string (texto original que identificó este plato)"
    }
  ],
  "unrecognized": ["string"] 
}`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'order_parse_result',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string' },
                        itemName: { type: 'string' },
                        quantity: { type: 'integer' },
                        spiceLevel: { type: ['string', 'null'] },
                        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                        originalText: { type: 'string' },
                      },
                      required: ['itemId', 'itemName', 'quantity', 'spiceLevel', 'confidence', 'originalText'],
                      additionalProperties: false,
                    },
                  },
                  unrecognized: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['items', 'unrecognized'],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        if (!rawContent) throw new Error('No response from AI');
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

        try {
          const parsed = JSON.parse(content);
          return parsed as {
            items: Array<{
              itemId: string;
              itemName: string;
              quantity: number;
              spiceLevel: string | null;
              confidence: 'high' | 'medium' | 'low';
              originalText: string;
            }>;
            unrecognized: string[];
          };
        } catch {
          throw new Error('AI returned invalid JSON');
        }
      }),

    // ========== IA - PARSE ORDER FROM HANDWRITTEN PHOTO ==========
    parseOrderFromImage: publicProcedure
      .input(z.object({
        imageBase64: z.string(), // base64 data URL (data:image/jpeg;base64,...)
        menuCatalog: z.array(z.object({
          id: z.string(),
          number: z.number().optional(),
          name: z.string(),
          price: z.number(),
          category: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { storagePut } = await import("./storage");

        // Upload image to S3 to get a public URL for the LLM
        const base64Data = input.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const mimeMatch = input.imageBase64.match(/^data:(image\/[a-z]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] ?? 'jpg';
        const fileName = `handwritten-orders/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { url: imageUrl } = await storagePut(fileName, imageBuffer, mimeType);

        const catalogText = input.menuCatalog
          .map(item => `- id:${item.id} | número:${item.number ?? '-'} | nombre:"${item.name}" | precio:${item.price}€`)
          .join('\n');

        const systemPrompt = `Eres un asistente de restaurante indio. Analiza la imagen de un papel con un pedido escrito a mano por un camarero y convíertelo en una lista de platos del menú.

Catálogo del menú:
${catalogText}

Reglas:
1. Lee toda la escritura a mano visible en la imagen
2. Identifica platos, cantidades y nivel de picante mencionados
3. Haz matching flexible con el catálogo (ignora mayúsculas, tildes, abreviaturas)
4. Si ves un número de plato (ej: "25", "n12"), úsalo para identificar el plato
5. Responde SOLO con JSON válido, sin texto adicional`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: imageUrl, detail: 'high' },
                },
                {
                  type: 'text',
                  text: 'Lee el pedido escrito a mano en esta imagen y convíertelo al formato JSON solicitado.',
                },
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'order_parse_result',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        itemId: { type: 'string' },
                        itemName: { type: 'string' },
                        quantity: { type: 'integer' },
                        spiceLevel: { type: ['string', 'null'] },
                        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                        originalText: { type: 'string' },
                      },
                      required: ['itemId', 'itemName', 'quantity', 'spiceLevel', 'confidence', 'originalText'],
                      additionalProperties: false,
                    },
                  },
                  unrecognized: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['items', 'unrecognized'],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        if (!rawContent) throw new Error('No response from AI');
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

        try {
          const parsed = JSON.parse(content);
          return parsed as {
            items: Array<{
              itemId: string;
              itemName: string;
              quantity: number;
              spiceLevel: string | null;
              confidence: 'high' | 'medium' | 'low';
              originalText: string;
            }>;
            unrecognized: string[];
          };
        } catch {
          throw new Error('AI returned invalid JSON');
        }
      }),

    // ========== CUSTOM ITEM LOG (platos frecuentes de Varios) ==========

    // Obtener platos frecuentes de Varios (aparecen 3+ veces)
    getFrequentCustomItems: publicProcedure
      .input(z.object({ minCount: z.number().default(3) }).optional())
      .query(async ({ input }) => {
        return await restaurantDb.getFrequentCustomItems(input?.minCount ?? 3);
      }),

     // Marcar un plato personalizado como ya añadido al menú
    markCustomItemAsAddedToMenu: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await restaurantDb.markCustomItemAsAddedToMenu(input.id);
        return { success: true };
      }),
  }),

  // ========== RESERVATIONS ==========
  reservations: router({
    // Obtener todas las reservas
    getAll: publicProcedure.query(async () => {
      const { getAllReservations } = await import('./reservationDb');
      return await getAllReservations();
    }),

    // Obtener reservas por fecha
    getByDate: publicProcedure
      .input(z.object({ date: z.string() })) // "YYYY-MM-DD"
      .query(async ({ input }) => {
        const { getReservationsByDate } = await import('./reservationDb');
        return await getReservationsByDate(input.date);
      }),

    // Obtener reservas por rango de fechas
    getByDateRange: publicProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ input }) => {
        const { getReservationsByDateRange } = await import('./reservationDb');
        return await getReservationsByDateRange(input.startDate, input.endDate);
      }),

    // Crear una nueva reserva
    create: publicProcedure
      .input(z.object({
        guestName: z.string().min(1),
        guestPhone: z.string().min(1),
        guestEmail: z.string().email().optional().nullable(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        partySize: z.number().int().min(1).max(50),
        tableId: z.string().optional().nullable(),
        status: z.enum(["pending", "confirmed", "seated", "cancelled", "no_show"]).default("confirmed"),
        notes: z.string().optional().nullable(),
        origin: z.enum(["manual", "web", "phone"]).default("manual"),
      }))
      .mutation(async ({ input }) => {
        const { createReservation } = await import('./reservationDb');
        const reservation = await createReservation(input);
        return reservation;
      }),

    // Actualizar una reserva
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        guestName: z.string().min(1).optional(),
        guestPhone: z.string().min(1).optional(),
        guestEmail: z.string().email().optional().nullable(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        partySize: z.number().int().min(1).max(50).optional(),
        tableId: z.string().optional().nullable(),
        status: z.enum(["pending", "confirmed", "seated", "cancelled", "no_show"]).optional(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { updateReservation } = await import('./reservationDb');
        const { id, ...data } = input;
        const reservation = await updateReservation(id, data);
        return reservation;
      }),

    // Cambiar solo el estado de una reserva
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "seated", "cancelled", "no_show"]),
      }))
      .mutation(async ({ input }) => {
        const { updateReservationStatus } = await import('./reservationDb');
        const reservation = await updateReservationStatus(input.id, input.status);
        return reservation;
      }),

    // Eliminar una reserva
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteReservation } = await import('./reservationDb');
        await deleteReservation(input.id);
        return { success: true };
      }),

    // Obtener disponibilidad para una fecha y tamaño de grupo
    getAvailability: publicProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        partySize: z.number().int().min(1).max(14),
      }))
      .query(async ({ input }) => {
        const { buildOccupiedSlots } = await import('./walkInDb');
        const { checkAvailabilityForDate } = await import('./tableAssignment');
        const { getTimeSlotsForDate } = await import('./reservationUtils');
        const slots = await buildOccupiedSlots(input.date);
        const timeSlots = getTimeSlotsForDate(input.date);
        if (timeSlots.length === 0) return { closed: true, slots: {} };
        const availability = checkAvailabilityForDate(slots, input.date, input.partySize, timeSlots);
        return { closed: false, slots: availability };
      }),

    // Asignar mesa automáticamente para una reserva
    assignTable: publicProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        partySize: z.number().int().min(1).max(14),
      }))
      .query(async ({ input }) => {
        const { buildOccupiedSlots } = await import('./walkInDb');
        const { assignTable, getOccupiedTableIds } = await import('./tableAssignment');
        const slots = await buildOccupiedSlots(input.date);
        const occupied = getOccupiedTableIds(slots, input.date, input.time);
        return assignTable(input.partySize, occupied);
      }),

    // Crear reserva con asignación automática de mesa
    createWithAssignment: publicProcedure
      .input(z.object({
        guestName: z.string().min(1),
        guestPhone: z.string().min(1),
        guestEmail: z.string().email().optional().nullable(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        partySize: z.number().int().min(1).max(14),
        notes: z.string().optional().nullable(),
        origin: z.enum(["manual", "web", "phone"]).default("manual"),
      }))
      .mutation(async ({ input }) => {
        const { buildOccupiedSlots, isPeakDay } = await import('./walkInDb');
        const { assignTable, getOccupiedTableIds, estimateEndTime } = await import('./tableAssignment');
        const { createReservation } = await import('./reservationDb');
        const slots = await buildOccupiedSlots(input.date);
        const occupied = getOccupiedTableIds(slots, input.date, input.time);
        const assignment = assignTable(input.partySize, occupied);
        if (!assignment.success) {
          return { success: false, reason: assignment.reason, reservation: null, assignment: null };
        }
        const peak = await isPeakDay(input.date);
        const estimatedEnd = peak ? estimateEndTime(input.time, 90) : null;
        const reservation = await createReservation({
          ...input,
          status: "confirmed",
          tableId: assignment.group!.tableIds[0],
          assignedTableIds: JSON.stringify(assignment.group!.tableIds),
          assignmentInstruction: assignment.instruction,
          estimatedEnd,
          isPeakDay: peak ? 1 : 0,
        });
        return { success: true, reservation, assignment };
      }),
  }),

  // ─── Walk-ins ──────────────────────────────────────────────────────────────
  walkIns: router({
    getByDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const { getWalkInsByDate } = await import('./walkInDb');
        return getWalkInsByDate(input.date);
      }),

    // Registrar walk-in con texto libre ("mesa 2 3 personas")
    createFromText: publicProcedure
      .input(z.object({
        text: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
      }))
      .mutation(async ({ input }) => {
        const { parseWalkInText, createWalkIn, isPeakDay } = await import('./walkInDb');
        const { estimateEndTime } = await import('./tableAssignment');
        const parsed = parseWalkInText(input.text);
        if (!parsed) {
          return { success: false, reason: 'No se pudo interpretar. Usa formato: "mesa 2 3 personas" o "terraza 4 personas"', walkIn: null, parsed: null };
        }
        const peak = await isPeakDay(input.date);
        const estimatedEnd = peak ? estimateEndTime(input.time, 90) : null;
        const walkIn = await createWalkIn({
          date: input.date,
          time: input.time,
          partySize: parsed.partySize,
          tableIds: [parsed.tableId],
          instruction: `Mesa ${parsed.tableId} — ${parsed.partySize} personas (walk-in)`,
          estimatedEnd: estimatedEnd ?? undefined,
          isPeakDay: peak,
          notes: `__walkin__ texto: "${input.text}"`,
        });
        return { success: true, walkIn, parsed };
      }),

    // Registrar walk-in con asignación automática de mesa
    createWithAssignment: publicProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        partySize: z.number().int().min(1).max(14),
        notes: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { createWalkIn, isPeakDay, buildOccupiedSlots } = await import('./walkInDb');
        const { getOccupiedTableIds, assignTable, estimateEndTime } = await import('./tableAssignment');
        const slots = await buildOccupiedSlots(input.date);
        const occupied = getOccupiedTableIds(slots, input.date, input.time);
        const assignment = assignTable(input.partySize, occupied);
        if (!assignment.success) {
          return { success: false, reason: assignment.reason, walkIn: null, assignment: null };
        }
        const peak = await isPeakDay(input.date);
        const estimatedEnd = peak ? estimateEndTime(input.time, 90) : null;
        const walkIn = await createWalkIn({
          date: input.date,
          time: input.time,
          partySize: input.partySize,
          tableIds: assignment.group!.tableIds,
          instruction: assignment.instruction,
          estimatedEnd: estimatedEnd ?? undefined,
          isPeakDay: peak,
          notes: input.notes ?? undefined,
        });
        return { success: true, walkIn, assignment };
      }),

    // Marcar walk-in como terminado (mesa libre)
    finish: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { finishWalkIn } = await import('./walkInDb');
        return finishWalkIn(input.id);
      }),

    // Cancelar walk-in
    cancel: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { cancelWalkIn } = await import('./walkInDb');
        return cancelWalkIn(input.id);
      }),
  }),

  // ─── Días punta ────────────────────────────────────────────────────────────
  peakDays: router({
    getByRange: publicProcedure
      .input(z.object({ from: z.string(), to: z.string() }))
      .query(async ({ input }) => {
        const { getPeakDaysByRange } = await import('./walkInDb');
        return getPeakDaysByRange(input.from, input.to);
      }),
    set: publicProcedure
      .input(z.object({ date: z.string(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { setPeakDay } = await import('./walkInDb');
        return setPeakDay(input.date, input.reason);
      }),
    remove: publicProcedure
      .input(z.object({ date: z.string() }))
      .mutation(async ({ input }) => {
        const { removePeakDay } = await import('./walkInDb');
        await removePeakDay(input.date);
        return { success: true };
      }),
    check: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const { isPeakDay } = await import('./walkInDb');
        return { isPeak: await isPeakDay(input.date) };
      }),
  }),
});
export type AppRouter = typeof appRouter;
