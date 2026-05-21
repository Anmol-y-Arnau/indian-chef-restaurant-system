# 🍛 Restaurant Management System

A complete, production-ready restaurant management system built with React 19, TypeScript, tRPC, and MySQL. Originally developed for **Indian Chef** restaurant, this codebase is designed as a **reusable template** that any restaurant can adapt to their own needs.

> **Live demo:** [indianchef-wznuppts.manus.space](https://indianchef-wznuppts.manus.space)

---

## What This System Does

This is a full-stack POS (Point of Sale) and kitchen management system with the following modules:

| Module | Description |
|---|---|
| **TPV / Order Panel** | Take orders per table, manage quantities, spice levels, notes |
| **Kitchen Display (KDS)** | Real-time view for the kitchen — shows pending dishes per table |
| **Tandoor View** | Filtered view showing only tandoor/oven dishes |
| **Reservations** | Full reservation calendar with table assignment and WhatsApp integration |
| **Sales History** | Complete sales log with payment methods, splits, and PDF tickets |
| **Invoices** | Generate invoices for frequent customers with NIF/VAT |
| **Statistics** | Revenue charts, best-selling items, daily/monthly breakdowns |
| **AI Order Entry** | Dictate or photograph a handwritten order — AI parses it into menu items |
| **WhatsApp Agent** | External bot (Paula) can check table availability and create reservations via API |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, shadcn/ui |
| State / API | tRPC 11, TanStack Query 5, Zod 4 |
| Backend | Node.js, Express 4, TypeScript |
| Database | MySQL / TiDB (via Drizzle ORM) |
| Auth | Manus OAuth (JWT session cookies) |
| File Storage | AWS S3 (tickets, invoices, order photos) |
| AI | OpenAI-compatible LLM (order parsing, image recognition) |
| Real-time | Polling every 3 seconds (no WebSocket needed) |
| Testing | Vitest — 117 tests, 15 test files |

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- A MySQL 8 / TiDB database
- An S3-compatible bucket (for PDF/image storage)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Anmol-y-Arnau/indian-chef-restaurant-system.git
cd indian-chef-restaurant-system

# 2. Install dependencies
pnpm install

# 3. Copy environment variables and fill them in
cp .env.example .env
# Edit .env with your database URL, JWT secret, S3 credentials, etc.

# 4. Push the database schema
pnpm db:push

# 5. Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Production Build

```bash
pnpm build
node dist/index.js
```

---

## Project Structure

```
├── client/                   # React frontend
│   ├── src/
│   │   ├── pages/            # Full-page views (Home, KitchenView, ReservationsView, StatsView…)
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/           # shadcn/ui primitives
│   │   ├── contexts/         # RestaurantContext, LanguageContext
│   │   ├── hooks/            # useHaptic, useAuth
│   │   ├── lib/              # data.ts (menu), trpc.ts, utils
│   │   └── _core/            # Auth hooks (useAuth)
│   └── public/               # Static assets (images, icons, sounds)
│
├── server/                   # Express + tRPC backend
│   ├── routers.ts            # All tRPC procedures (the API contract)
│   ├── restaurantDb.ts       # All database query helpers
│   ├── reservationDb.ts      # Reservation-specific queries
│   ├── reservationsApi.ts    # Public REST API (for WhatsApp bot)
│   ├── tableAssignment.ts    # Table-group assignment logic
│   ├── storage.ts            # S3 helpers (storagePut, storageGet)
│   └── _core/                # Framework plumbing (auth, context, LLM, OAuth)
│
├── drizzle/
│   ├── schema.ts             # Database tables and TypeScript types
│   └── migrations/           # Auto-generated migration files
│
├── shared/                   # Types and constants shared between client and server
│
└── docs/                     # Extended documentation
    ├── ARCHITECTURE.md       # System design and data flow
    ├── CUSTOMIZATION.md      # How to adapt this for your restaurant
    └── BUGFIXES.md           # All bugs fixed during development
```

---

## Database Schema (Summary)

| Table | Purpose |
|---|---|
| `users` | Staff accounts (role: `admin` \| `user`) |
| `restaurant_tables` | Table registry with capacity and status |
| `orders` | Active orders per table (pending/delivered) |
| `sales` | Completed sales history with payment details |
| `reservations` | Reservation calendar |
| `frequent_customers` | Customer database for invoicing |
| `invoices` | VAT invoices linked to customers |
| `custom_items_log` | Log of free-text items added by staff |

---

## API Reference

The system exposes two types of API:

### tRPC (internal — used by the frontend)

All procedures are defined in `server/routers.ts`. Key namespaces:

- `restaurant.*` — tables, orders, sales, invoices, customers
- `reservations.*` — CRUD + availability check
- `auth.*` — login/logout/me
- `system.*` — owner notifications

### Public REST API (for external bots like WhatsApp)

Protected by `Bearer` token (`RESERVATIONS_API_KEY` env variable).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/public/tables` | List all tables with status and capacity |
| `GET` | `/api/public/reservations/availability` | Check availability for date/time/party |
| `POST` | `/api/public/reservations` | Create a reservation (origin: "whatsapp") |

---

## Running Tests

```bash
pnpm test
```

117 tests across 15 test files covering: auth, orders, reservations, AI parsing, PDF generation, batch delivery, and more.

---

## Documentation

| File | Contents |
|---|---|
| [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) | Step-by-step guide to adapt this for any restaurant |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, real-time sync strategy |
| [`docs/BUGFIXES.md`](docs/BUGFIXES.md) | All bugs fixed during development with root cause and solution |
| [`.env.example`](.env.example) | All required environment variables with descriptions |

---

## License

MIT — free to use, modify, and deploy for any restaurant.
