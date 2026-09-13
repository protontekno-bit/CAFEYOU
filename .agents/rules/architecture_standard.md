# Workspace Architecture & Code Standard for CAFEYOU

This repository follows strict modularity, token-efficiency, and domain-driven design principles for all AI assistants and human developers:

1. **Component Modularity**:
   - Screen files (`GuestScreen`, `PosScreen`, `OperatorScreen`) are Orchestrators only.
   - Tabs and modals must be separate files in `src/components/{domain}/`.
   - Keep files under ~400 lines for maximum AI comprehension and token efficiency.

2. **Domain State Management**:
   - Complex business logic belongs in domain hooks under `src/hooks/domains/`:
     - `useKaraokePlayer.ts` for songs, playback, fair queue, TV display.
     - `useOrderBilling.ts` for menus, table orders, KDS workflow.
     - `useCashExpenses.ts` for petty cash expense tracking.
     - `useVoucherAuth.ts` for table auth, vouchers, daily PIN, cafe settings.
   - `src/hooks/useKaraoke.ts` acts as the master facade to ensure 100% backward compatibility for all consumer components.

3. **Financial Calculation Standard**:
   - Always use `src/utils/billing.ts` (`formatRupiah`, `calculateTaxAndService`) for money, taxes, and service charges. Never perform ad-hoc rounding or tax calculations.

4. **Firebase Realtime Database Synchronization**:
   - `tableOrders` and `expenses` must be synchronized via atomic leaf-node writes (`set(ref, data)`), never overwritten by root debounced sync state.

5. **Visual Standards & Quality Assurance**:
   - Maintain dark mode aesthetic (`slate-900`/`slate-950`, tailored accents, glassmorphism, responsive mobile layouts).
   - Always verify compilation with `npm run build` before finishing any task.
