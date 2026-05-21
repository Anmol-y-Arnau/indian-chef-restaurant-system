# Customization Guide — Adapt This System to Any Restaurant

This guide explains every change you need to make to turn this codebase into a fully branded, independent system for a different restaurant. Follow the steps in order.

---

## 1. Restaurant Name and Branding

### App title and logo

Edit `client/index.html`:
```html
<title>Your Restaurant Name</title>
```

Edit `client/src/lib/const.ts` (or wherever `APP_TITLE` is defined):
```ts
export const APP_TITLE = "Your Restaurant Name";
```

Replace the logo image at `client/public/images/chef-icon.png` with your own logo (keep the same filename or update all references).

Replace the hero background at `client/public/images/hero-bg.jpg` with a photo of your restaurant or food.

### Color palette

The entire color scheme is defined in `client/src/index.css` using CSS custom properties. The key variables to change are:

```css
:root {
  --primary: /* your main brand color (e.g. orange for Indian, red for Italian) */;
  --secondary: /* accent color */;
  --background: /* page background */;
  --foreground: /* text color */;
}
```

The project uses Tailwind CSS 4 with OKLCH colors. Use a tool like [oklch.com](https://oklch.com) to find the OKLCH values for your brand colors.

---

## 2. Menu Items

The entire menu is defined in a single file: **`client/src/lib/data.ts`**.

### Categories

```ts
export const CATEGORIES: Category[] = [
  { id: "starters", name: "Starters", icon: "🥗" },
  { id: "mains",    name: "Main Courses", icon: "🍽️" },
  { id: "desserts", name: "Desserts", icon: "🍮" },
  { id: "drinks",   name: "Drinks", icon: "🥤" },
  // Add or remove categories as needed
];
```

### Menu items

Each item follows this structure:

```ts
{
  id: "unique-item-id",        // Must be unique, no spaces
  name: "Dish Name",           // Primary language name
  name_en: "Dish Name EN",     // English translation (optional)
  name_fr: "Dish Name FR",     // French translation (optional)
  description: "...",
  price: 12.50,                // In euros (or your currency)
  category: "starters",        // Must match a category id
  image: "https://...",        // URL to dish photo
  number: 1,                   // Quick-order number (unique per item)
  spiceLevels: true,           // Show spice selector (true/false)
  isMenuDelDia: false,         // Mark as "Menu of the Day" special
}
```

**Tip:** Keep item IDs stable — they are stored in the `orders` and `sales` tables. Changing an ID after go-live will break historical data lookups.

---

## 3. Tables

Tables are initialized from the frontend via the `restaurant.initializeTables` tRPC procedure. The default table list is defined in:

**`server/tableAssignment.ts`**:
```ts
export const TABLES = [
  { id: "1",  name: "Mesa 1",  capacity: 4 },
  { id: "2",  name: "Mesa 2",  capacity: 4 },
  // ...
  { id: "0+", name: "Mesa 0+", capacity: 8 },  // Terrace / special
  { id: "0-", name: "Mesa 0-", capacity: 6 },  // Bar / takeaway
];
```

Change the IDs, names, and capacities to match your restaurant layout. The `id` field is stored in the database — keep it short and alphanumeric.

---

## 4. Languages

The system supports multiple languages. All UI strings are in:

**`client/src/lib/translations.ts`**

```ts
export const translations = {
  es: {
    app_title: "Indian Chef",
    table: "Mesa",
    // ... all Spanish strings
  },
  en: {
    app_title: "Indian Chef",
    table: "Table",
    // ... all English strings
  },
  fr: { /* French */ },
};
```

Add or remove languages by adding/removing keys. The language switcher in the UI will automatically show all available languages.

---

## 5. Spice Levels

Spice levels are specific to Indian cuisine. If your restaurant does not need them, set `spiceLevels: false` on all menu items in `data.ts`. The spice selector will not appear.

If you want to rename them (e.g., for a Mexican restaurant: "Mild / Medium / Hot / Extra Hot"), edit:

**`client/src/components/CustomizationModal.tsx`** — the spice level labels and icons.

**`server/restaurantDb.ts`** — the `spiceLevel` field accepts any string up to 10 characters.

---

## 6. Payment Methods

Payment options are defined in **`client/src/components/PaymentModal.tsx`**:

```ts
const PAYMENT_METHODS = [
  { id: "cash",  label: "Efectivo",  icon: "💵" },
  { id: "card",  label: "Tarjeta",   icon: "💳" },
  { id: "mixed", label: "Mixto",     icon: "🔀" },
];
```

Add, remove, or rename payment methods. The `id` is stored in the `sales` table.

---

## 7. Kitchen Display Sections

The Kitchen Display groups dishes by section (e.g., "Entrantes", "Platos Principales"). These groups are defined in:

**`server/tableAssignment.ts`**:
```ts
export const TABLE_GROUPS = [
  { label: "ENTRANTES",        categoryIds: ["starters", "chaats", "salads"] },
  { label: "PLATOS PRINCIPALES", categoryIds: ["mains", "curries", "biryani"] },
  { label: "BEBIDAS (Camarero)", categoryIds: ["drinks", "wines", "coffee"] },
];
```

Map your category IDs to the kitchen sections that make sense for your workflow.

---

## 8. WhatsApp / External API Integration

The public REST API is protected by a Bearer token. Set this in your `.env`:

```
RESERVATIONS_API_KEY=your-secret-key-here
```

The external bot (WhatsApp agent, n8n workflow, etc.) must send this token in the `Authorization` header:

```
Authorization: Bearer your-secret-key-here
```

Available endpoints: see `server/reservationsApi.ts` and the API Reference in the main README.

---

## 9. Currency and Locale

Currency symbol is hardcoded as `€` in several components. To change it, search for `€` across the `client/src` directory and replace with your currency symbol.

Date formatting uses the browser's `toLocaleString()` — it will automatically use the user's locale. If you need to force a specific locale, pass it as the first argument: `new Date().toLocaleString('en-GB')`.

---

## 10. Environment Variables

Copy `.env.example` to `.env` and fill in all values. The critical ones are:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Random string (min 32 chars) for session signing |
| `RESERVATIONS_API_KEY` | Secret token for the public REST API |
| `BUILT_IN_FORGE_API_KEY` | LLM API key (for AI order parsing) |
| `BUILT_IN_FORGE_API_URL` | LLM API base URL |

---

## 11. Removing Features You Don't Need

| Feature | How to remove |
|---|---|
| AI order parsing | Delete `parseOrderWithAI` and `parseOrderFromImage` procedures from `server/routers.ts`. Remove `QuickOrderDialog` AI tabs. |
| Reservations | Remove `ReservationsView.tsx`, delete `reservationDb.ts` and the `reservations` tRPC namespace. |
| Invoices | Remove `InvoiceDialog.tsx`, delete invoice procedures from `server/routers.ts`. |
| Tandoor view | Remove `TandoorView.tsx` and its route in `App.tsx`. |
| Language switcher | Remove `LanguageSwitcher.tsx` and the `LanguageContext`. Hardcode one language. |
| Spice levels | Set `spiceLevels: false` on all items in `data.ts`. |

---

## Checklist for a New Restaurant Deployment

- [ ] Update restaurant name in `client/index.html` and `const.ts`
- [ ] Replace logo at `client/public/images/chef-icon.png`
- [ ] Replace hero image at `client/public/images/hero-bg.jpg`
- [ ] Update color palette in `client/src/index.css`
- [ ] Replace all menu items in `client/src/lib/data.ts`
- [ ] Update table list in `server/tableAssignment.ts`
- [ ] Update kitchen sections in `TABLE_GROUPS`
- [ ] Update translations in `client/src/lib/translations.ts`
- [ ] Set all environment variables in `.env`
- [ ] Run `pnpm db:push` to create the database tables
- [ ] Run `pnpm test` to verify everything works
- [ ] Deploy and test on a real device (tablet recommended for kitchen display)
