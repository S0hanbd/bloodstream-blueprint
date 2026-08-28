# Full Technical & Design Audit Report: UAP Blood Bank (Bloodstream)

**Target Web Application:** UAP Blood Bank (`Bloodstream`)  
**Audit Date:** August 28, 2026  
**Tech Stack:** React 18, Vite, TypeScript 5.8, Tailwind CSS v3, Radix UI / Shadcn, Lucide Icons, Supabase SDK, Vercel Serverless Functions  
**Audit Scope:** Full Codebase (Frontend, Backend APIs, State Management, UI/UX, Security, Medical Logic, SEO, Code Quality)

---

## Executive Summary

The **UAP Blood Bank** (Bloodstream) web application is a community-focused platform built to connect blood donors and recipients within the University of Asia Pacific (UAP) ecosystem in Bangladesh. The application features a clean aesthetic, comprehensive dummy data for Bangladeshi donors, search and filtering capabilities, donor profile management, donation logging with a 105-day medical cooldown, and daily donor confirmations.

While the foundation is solid and visually appealing, the audit revealed critical architectural disconnections, security vulnerabilities in data storage, ESLint code quality issues, and UX edge cases that need to be addressed to make the application production-ready.

---

## 1. Architecture & Data Flow Audit

### 🚨 Critical Findings

1. **Dual Storage Disconnection (Offline-First Disconnect)**
   - **Issue:** The frontend services (`authService`, `donorService`, `confirmationService` in [`src/lib/auth.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/lib/auth.ts)) operate primarily on `localStorage`. When actions occur (e.g., registration or donor update), a `fetch('/api/...')` call is executed asynchronously with `.catch(() => {})`. However, data is **never fetched from the backend API during reading/searching**.
   - **Impact:** Multi-device synchronization is completely broken. If User A registers on Device 1, User B on Device 2 will never see User A in search results because Search queries `localStorage` directly without checking the server/Supabase database.

2. **Stateless Ephemeral In-Memory Store**
   - **Issue:** [`api/_store.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/api/_store.ts) uses top-level JavaScript arrays (`memoryUsers`, `memoryDonors`, `memoryConfirmations`) as a fallback when Supabase credentials (`VITE_SUPABASE_URL`) are absent.
   - **Impact:** Serverless environments (Vercel) recycle function containers frequently. Any write to `memoryUsers` or `memoryDonors` on Vercel is lost when the lambda instance turns off or restarts.

3. **Plaintext Password Storage in LocalStorage**
   - **Issue:** `localStorage.setItem('bloodbank_users', ...)` stores all registered user objects including unencrypted, plaintext passwords (`password: userData.password`).
   - **Impact:** High Security Vulnerability (OWASP A02:2021 - Cryptographic Failures). Anyone opening Chrome DevTools / Application / Local Storage on a shared computer can view every user's plaintext password.

---

## 2. Code Quality, Linter & Type Safety Audit

### ⚠️ Automated Linter Results (`npm run lint`)
- **Total Problems:** 30 (22 Errors, 8 Warnings)

| File Location | Line | Severity | Rule ID | Description |
| :--- | :--- | :--- | :--- | :--- |
| [`api/_store.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/api/_store.ts) | 75, 76, 77 | Error | `prefer-const` | `memoryUsers`, `memoryDonors`, `memoryConfirmations` are never reassigned. |
| [`api/_store.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/api/_store.ts) | 79 | Error | `@typescript-eslint/no-explicit-any` | `applyCors(req: any, res: any)` uses explicit `any`. |
| [`api/donors.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/api/donors.ts) | 20, 29, 37 | Error | `@typescript-eslint/no-explicit-any` | Multiple untyped parameter usages in array `.map()` and `.filter()`. |
| [`api/donors.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/api/donors.ts) | 52 | Error | `prefer-const` | Variable `filtered` declared with `let` without re-assignment. |
| [`src/pages/Search.tsx`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/pages/Search.tsx) | 28 | Warning | `react-hooks/exhaustive-deps` | `useEffect` missing `executeSearch` in dependency array. |
| [`tailwind.config.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/tailwind.config.ts) | 90 | Error | `@typescript-eslint/no-require-imports` | CommonJS `require('tailwindcss-animate')` used in ESM context. |
| [`vite.config.ts`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/vite.config.ts) | 22–41 | Error | `@typescript-eslint/no-explicit-any` | 8 explicit `any` type casts in custom API server middleware. |
| Various [`src/components/ui/`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/components/ui) | — | Warning | `react-refresh/only-export-components` | Exporting helper constants (e.g. `buttonVariants`) alongside components causes HMR refresh warnings. |

---

## 3. Medical & Business Logic Audit

1. **105-Day Medical Cooldown Accuracy & Validation**
   - **Current Rule:** Whole blood donation eligibility requires a 105-day (approx. 3.5 months) recovery period in accordance with medical standards.
   - **Logic Implementation:** [`donorService.isDonorAvailable()`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/lib/auth.ts#L262) calculates:
     ```ts
     const daysSinceLastDonation = Math.floor((todayTime - lastTime) / (1000 * 60 * 60 * 24));
     return daysSinceLastDonation >= 105;
     ```
   - **Issue:** Dates parsed from standard `YYYY-MM-DD` strings inherit UTC or local midnight depending on string constructor formatting. If a user sets `last_donation_date` via the HTML `<input type="date">`, timezone offsets can distort the calculated days by $\pm 1$ day.
   - **Missing Guard:** The date picker input on [`Dashboard.tsx`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/pages/Dashboard.tsx#L286) allows selecting **future dates**, which can corrupt eligibility logic.

2. **Accidental Donation Trigger**
   - In [`Dashboard.tsx`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/pages/Dashboard.tsx#L232), clicking "I Have Donated Blood" instantly modifies `last_donation_date` to today's date and locks the user out for 105 days without an `AlertDialog` confirmation step.

3. **Daily Confirmation Integrity**
   - [`confirmationService.confirmDonor()`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/lib/auth.ts#L331) enforces a 2-confirmation per day per user limit.
   - **Flaw:** Because confirmations are stored locally per browser instance, logged-in users can clear `localStorage` or open an incognito session to bypass the limit and flood donor confirmations.

---

## 4. UI/UX & Visual Design Audit

1. **Brand Identity & Title Consistency**
   - HTML Page `<title>` in [`index.html`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/index.html) reads `"Bloodstream"`, whereas Navbar and Hero UI display `"UAP Blood Bank"`.
2. **Mobile Navigation Drawer**
   - [`Header.tsx`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/components/Header.tsx) lacks a responsive Sheet/Hamburger menu for mobile viewports (`< 768px`). Nav items line up horizontally, leading to squeezed layout or clipping on smaller devices.
3. **Hero vs Statistics Section Layout**
   - On [`Index.tsx`](file:///c:/Users/Elitebook/Documents/Bloodstream%20%20blueprint/src/pages/Index.tsx#L22), the 3 stat counter cards (`Blood Bags Donated`, `Registered Users`, `Active Donors`) sit *above* the Hero section header (`UAP Blood Bank`). Standard UI design hierarchy places the Hero title & value proposition at the top, followed by statistics.
4. **Form Controls & Ergonomics**
   - Login page lacks a show/hide password toggle.
   - Phone input lacks auto-formatting or validation for Bangladeshi mobile numbers (`013-019` prefixes).
   - UAP ID input lacks format validation (e.g. 8-digit numeric student ID check).

---

## 5. SEO, Accessibility (a11y) & Performance Audit

1. **SEO Meta Data & OpenGraph**
   - Missing dynamic document titles on client-side route changes (`document.title = "Search Donors | UAP Blood Bank"`).
   - `index.html` lacks canonical tag, site favicon (`favicon.ico`/`svg`), and structured schema (`application/ld+json`).
2. **Accessibility**
   - Form controls rely on toast notifications for errors rather than rendering `aria-describedby` inline error messages adjacent to invalid inputs.
   - Icon-only interactive buttons (e.g. reload dummy data button) need explicit `aria-label` tags for screen reader compatibility.

---

## Recommended Action Plan & Fixes

1. **Fix Dual Storage & Backend Sync:** Update `authService`, `donorService`, and `confirmationService` to fetch live data from `/api/*` with fallback to `localStorage` when offline.
2. **Secure Passwords:** Omit password fields prior to storing user lists in `localStorage` or hash them client-side.
3. **Clear Linter Errors:** Fix all 30 ESLint issues (`prefer-const`, `@typescript-eslint/no-explicit-any`, missing hook dependencies, ESM import for Tailwind animate).
4. **Enhance UI/UX:**
   - Add responsive Mobile Hamburger menu in `Header.tsx`.
   - Swap Hero section and Statistics section position on `Index.tsx`.
   - Add `max={today}` constraint on date input and add an alert dialog before recording a donation.
   - Add show/hide password toggle on `Login.tsx` and `Register.tsx`.
5. **Set Up SEO & Page Titles:** Add dynamic `useTitle` hook for route transitions and update `index.html` metadata.
