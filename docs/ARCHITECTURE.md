# System Architecture

## Overview

The system is a single-tenant, full-stack web application. It runs as one Node.js process that serves both the React frontend (via Vite in development, static files in production) and the Express/tRPC API.

```
Browser (React)
    │
    │  HTTP + tRPC (JSON-RPC over HTTP)
    ▼
Express Server (Node.js)
    ├── /api/trpc/*          ← tRPC router (all internal API calls)
    ├── /api/public/*        ← REST API (WhatsApp bot, external integrations)
    ├── /api/oauth/*         ← Manus OAuth callback
    └── /*                   ← Vite static assets (React app)
    │
    ▼
MySQL / TiDB Database
    +
AWS S3 (PDF tickets, invoice PDFs, order photos)
    +
LLM API (AI order parsing)
```

---

## Real-Time Synchronization

The system does **not** use WebSockets. Instead, it uses **polling every 3 seconds** from the kitchen display and tandoor view. This was a deliberate choice for simplicity and reliability in a restaurant environment where network conditions can be unpredictable.

The polling strategy:
1. `KitchenView` and `TandoorView` call `trpc.restaurant.getActiveOrders.useQuery()` with `refetchInterval: 3000`.
2. The server queries the `orders` table filtered by tables with `status = 'occupied'`.
3. React Query's **structural sharing** ensures components only re-render when data actually changes — not on every poll.

**Why not WebSockets?** In a restaurant, the kitchen display is often a cheap tablet on a wall mount. Polling is more resilient to brief network drops and requires no persistent connection management.

---

## Authentication

Authentication uses **Manus OAuth** (an OpenID Connect flow). The session is stored as a signed JWT in an HTTP-only cookie.

- `server/_core/oauth.ts` — handles the OAuth callback and sets the cookie
- `server/_core/context.ts` — reads the cookie on every request and injects `ctx.user`
- `protectedProcedure` — a tRPC middleware that throws `UNAUTHORIZED` if `ctx.user` is null
- `adminProcedure` — extends `protectedProcedure`, throws `FORBIDDEN` if `ctx.user.role !== 'admin'`

The system is currently configured as a **single-tenant internal tool** — all staff share the same app instance. The `role` field (`admin` | `user`) is available for future role-based access control.

---

## Database Design

All timestamps are stored as UTC. The frontend converts to local time for display using `new Date(utcMs).toLocaleString()`.

### Key relationships

```
restaurant_tables (tableId)
    │
    ├──< orders (tableId)           Active orders — cleared when table is paid
    │
    └──< sales (tableId)            Completed sales — permanent history
            │
            └──< invoices           VAT invoices linked to frequent_customers

frequent_customers
    └──< invoices

reservations (tableId, assignedTableIds JSON)
```

### Order lifecycle

```
addOrder → orders table (isDelivered=0)
    │
    ├── Kitchen marks delivered → isDelivered=1
    │
    └── Staff completes payment → completeTable()
            ├── Copies orders to sales table
            └── Deletes from orders table (table is now free)
```

### Sale vs Order

- **`orders`** = live, in-progress orders. Deleted after payment.
- **`sales`** = permanent history. Never deleted (except by admin).

---

## tRPC Router Structure

All procedures live in `server/routers.ts`. The router is split into namespaces:

| Namespace | Procedures | Purpose |
|---|---|---|
| `auth` | `me`, `logout` | Session management |
| `restaurant` | 20+ procedures | Tables, orders, sales, invoices, customers |
| `reservations` | `getAll`, `getByDate`, `create`, `update`, `checkAvailability` | Reservation calendar |
| `system` | `notifyOwner` | Push notification to restaurant owner |

For maintainability, once `routers.ts` exceeds ~200 lines, split into `server/routers/restaurant.ts`, `server/routers/reservations.ts`, etc.

---

## File Storage (S3)

All binary files (PDF tickets, invoice PDFs, order photos) are stored in S3. The database stores only the S3 URL.

```ts
// Upload
const { url } = await storagePut(fileKey, buffer, "application/pdf");
await db.insert(invoices).values({ pdfUrl: url, ... });

// Retrieve
const invoice = await db.select().from(invoices).where(...);
// invoice.pdfUrl is a public S3 URL — serve directly to the browser
```

File keys use random suffixes to prevent enumeration: `invoices/INV-2024-001-a3f9b2.pdf`.

---

## AI Order Parsing

Two AI-powered order entry modes:

1. **Text mode** (`parseOrderWithAI`): Staff types a free-text order (e.g., "dos butter chicken, un naan, una cerveza"). The LLM receives the full menu catalog and returns a structured JSON array of matched items with confidence scores.

2. **Photo mode** (`parseOrderFromImage`): Staff photographs a handwritten order slip. The image is uploaded to S3, then sent to the LLM with `image_url` content type. The LLM reads the handwriting and returns the same structured format.

Both modes show a **confirmation preview** before adding items to the table — the staff can remove misrecognized items before confirming.

---

## Public REST API (WhatsApp Integration)

The public API at `/api/public/*` is designed for external bots and integrations. It is:

- **Stateless** — no session cookies, uses Bearer token authentication
- **Rate-limited** — 30 requests per minute per IP
- **Validated** — all inputs sanitized and validated server-side (Zod + custom sanitization)

The WhatsApp agent (Paula) uses this API to:
1. Check table availability for a given date/time/party size
2. Create reservations on behalf of customers
3. Read current table status

---

## Security Model

| Layer | Mechanism |
|---|---|
| Session auth | HTTP-only JWT cookie, signed with `JWT_SECRET` |
| Public API auth | Bearer token (`RESERVATIONS_API_KEY`) |
| Rate limiting | `express-rate-limit` — 300 req/min general, 30 req/min public API |
| Input validation | Zod schemas on all tRPC inputs; custom sanitization on REST API |
| Secrets | All secrets in environment variables, never in code |
| HTTPS | Enforced by the hosting proxy (Manus platform) |

**Note on RLS:** The system is single-tenant (one restaurant). There is no row-level security because all authenticated staff have access to all data. If this system is extended to multi-tenant (multiple restaurants on one instance), add a `tenantId` column to all tables and filter every query by `tenantId`.
