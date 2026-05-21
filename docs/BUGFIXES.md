# Bug Fixes Log

This document records every significant bug fixed during development, with root cause analysis and the solution applied. It serves as a reference for anyone maintaining or extending this system.

---

## BUG-001 — Kitchen Display scroll resets on every poll

**Symptom:** When the kitchen display polled for new orders every 3 seconds, the scroll position of every table card reset to the top, making it impossible to read long orders.

**Root cause:** `TableCard` and `OrderItemRow` were defined as **functions inside `KitchenView`** (the parent component). Every time `KitchenView` re-rendered (every 3 seconds), React created a new function reference for these components. React treats a new function reference as a new component type, so it unmounted and remounted the entire DOM subtree — including resetting scroll position.

**Fix:** Moved `TableCard` and `OrderItemRow` outside of `KitchenView` as **module-level components**. React now recognizes the same component type between renders and only updates props, preserving internal state (including scroll position).

**Files changed:** `client/src/pages/KitchenView.tsx`

---

## BUG-002 — N+1 re-renders when marking items as delivered

**Symptom:** Clicking "mark all as delivered" on a table caused N individual API calls (one per item), each triggering a re-render. With 10+ items, this caused visible flickering and scroll jumps.

**Root cause:** The delivery status was updated one item at a time in a loop, each call invalidating the React Query cache and triggering a re-render.

**Fix:** Added `batchUpdateDeliveryStatus` endpoint that updates all items in a **single SQL query** using `inArray`. Added **optimistic updates** on the frontend — the cache is updated immediately before the server responds, so there is no visible flicker.

**Files changed:** `server/restaurantDb.ts`, `server/routers.ts`, `client/src/components/TableCard.tsx`

---

## BUG-003 — PaymentModal and CustomSplitModal hidden behind sticky header

**Symptom:** On mobile, the payment modal appeared behind the sticky category bar, making it impossible to interact with.

**Root cause:** The modals were rendered as regular DOM children inside the component tree, subject to the stacking context of their parent. The sticky category bar had `z-index: 30`, which was higher than the modal.

**Fix:** Converted both modals to use **Radix UI Dialog** (which renders into a portal at the document root, outside any stacking context). Reduced the category bar z-index from `z-30` to `z-10`.

**Files changed:** `client/src/components/PaymentModal.tsx`, `client/src/components/CustomSplitModal.tsx`, `client/src/pages/Home.tsx`

---

## BUG-004 — Orphaned orders appearing in kitchen after page reload

**Symptom:** After a server restart or page reload, the kitchen display showed orders from tables that were already paid and cleared, because the `orders` table still had rows from a previous session that were not properly deleted.

**Root cause:** The `completeTable` mutation deleted orders correctly, but if the server crashed mid-transaction or the browser was closed before payment, orders remained in the database with no corresponding active table.

**Fix:** Added `cleanOrphanedOrders` function that deletes all orders belonging to tables with `status = 'free'`. This is called automatically when `KitchenView` and `TandoorView` mount. Also added `getActiveOrders` endpoint that only returns orders for tables with `status = 'occupied'`.

**Files changed:** `server/restaurantDb.ts`, `server/routers.ts`, `client/src/pages/KitchenView.tsx`, `client/src/pages/TandoorView.tsx`

---

## BUG-005 — Missing translation keys causing runtime errors

**Symptom:** Several UI elements showed the raw translation key string (e.g., `"cancel_release"`) instead of the translated text.

**Root cause:** Translation keys used in components did not match the keys defined in `translations.ts`. The `t()` function returned the key itself as fallback instead of throwing, making the bug silent.

**Fix:** Added all missing keys to `translations.ts`: `select_table`, `empty_order`, `no_orders_print`, `ticket_copied`, `ticket_sent_printer`. Corrected `welcome_message` → `welcome_desc` in `OrderPanel.tsx`.

**Files changed:** `client/src/lib/translations.ts`, `client/src/components/OrderPanel.tsx`

---

## BUG-006 — Menu item badge showing "0" as text

**Symptom:** Menu items with `number: 0` displayed a visible "0" badge on the card, which was confusing since 0 is not a valid quick-order number.

**Root cause:** The badge condition was `{item.number && <Badge>}`. In JavaScript, `0` is falsy, so `0 && <Badge>` evaluates to `0` — which React renders as the text "0".

**Fix:** Changed the condition to `{item.number != null && item.number !== 0 && <Badge>}`.

**Files changed:** `client/src/components/MenuCard.tsx`

---

## BUG-007 — ScrollArea not scrolling in SoundSettingsDialog

**Symptom:** The sound settings panel could not be scrolled — the list of categories and delivered tables was cut off at the bottom.

**Root cause (first attempt):** The `ScrollArea` component from shadcn/ui requires an explicit height to function. Without it, the component grows to fit its content and never activates the scroll mechanism.

**Root cause (second attempt):** After adding `overflow-y-auto` to the dialog content, the footer buttons ("Cancel" / "Save") were inside the scroll area, causing them to scroll away and become unreachable.

**Fix:** Restructured the dialog layout with a fixed header, a `ScrollArea` with explicit `h-[60vh]`, and a fixed footer outside the scroll area. All variable content (sound toggle, category list, delivered tables) lives inside the scroll area.

**Files changed:** `client/src/components/SoundSettingsDialog.tsx`

---

## BUG-008 — Completed tables still visible in Kitchen Display

**Symptom:** Tables where all dishes had been marked as delivered continued to appear in the kitchen grid in a "collapsed" state, cluttering the display.

**Root cause:** The filter only hid tables with no orders at all. Tables where all orders had `isDelivered=1` were still included in the active grid.

**Fix:** Added `isFullyDelivered` computed property. Tables where every order has `isDelivered=1` are filtered out of the main grid. They are accessible via the settings panel (gear icon) under "Delivered Tables", with an option to reactivate them if needed.

**Files changed:** `client/src/pages/KitchenView.tsx`, `client/src/components/SoundSettingsDialog.tsx`

---

## BUG-009 — Rate limiting breaking tests

**Symptom:** After adding `express-rate-limit`, the test suite started failing intermittently because multiple test requests from the same IP hit the rate limit.

**Root cause:** Rate limiting was applied globally, including in the `test` environment.

**Fix:** Rate limiting is only applied when `NODE_ENV !== 'test'`.

**Files changed:** `server/_core/index.ts`

---

## BUG-010 — TypeScript error: RESTAURANT_TABLES not exported

**Symptom:** The WhatsApp API integration required a `RESTAURANT_TABLES` export from `tableAssignment.ts`, but only `TABLES` existed.

**Root cause:** The WhatsApp integration was developed against a different version of the file that used a different export name.

**Fix:** Added `export const RESTAURANT_TABLES = TABLES` as an alias in `tableAssignment.ts` to maintain backward compatibility.

**Files changed:** `server/tableAssignment.ts`

---

## BUG-011 — serviceDate stored as payment date instead of service date

**Symptom:** In the sales history, the "date" shown for a sale was the time of payment, not the time the table was first served. This caused incorrect daily revenue reports when a table ordered at 23:50 but paid at 00:10 the next day.

**Root cause:** `serviceDate` was set to `new Date()` at payment time instead of the timestamp of the first order.

**Fix:** The `completeTable` procedure now queries the oldest order for the table and uses its `createdAt` as the `serviceDate`.

**Files changed:** `server/routers.ts`

---

## BUG-012 — Infinite re-render loop from unstable query inputs

**Symptom:** Some pages caused infinite API request loops, visible as hundreds of requests per second in the browser network tab.

**Root cause:** Query inputs were created as new object/array literals inside the component render function (e.g., `useQuery({ ids: [1, 2, 3] })`). tRPC triggers a new query when the input reference changes. Since `[1, 2, 3]` creates a new array on every render, this caused an infinite loop.

**Fix:** Stabilized all query inputs with `useState` (for values that don't change) or `useMemo` (for computed values).

**Files changed:** Multiple page components.
