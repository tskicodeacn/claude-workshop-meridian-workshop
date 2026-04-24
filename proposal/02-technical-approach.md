# Technical Approach

**RFP #MC-2026-0417 — Meridian Components**

---

## Our Starting Point

Before writing a single line of code, we read the previous vendor's handoff notes and reviewed the source code provided with this RFP. The application is a Vue 3 / Python FastAPI stack with JSON-file data storage, running on ports 3000 (frontend) and 8001 (backend). The handoff documentation is thin — which is itself a finding. Our scoping is based on the actual codebase, not the documentation.

This matters: it means our estimates below are grounded in what's really there, not what was supposed to be delivered.

---

## R1 — Reports Module Remediation

**The problem.** The Reports module was explicitly flagged as incomplete at handoff. Meridian has logged eight defects covering filter behavior, internationalization gaps, and inconsistent data patterns. We have the list.

**Our approach.** We will conduct a systematic audit of the Reports page against the four-filter system (Time Period, Warehouse, Category, Order Status) documented in the handoff notes. We will:

1. Map each of the eight known defects to the specific component, API call, or data binding responsible
2. Reproduce each defect in a local environment before touching code — no blind fixes
3. Resolve each defect with a targeted change and a regression note
4. Run a final pass to identify any defects not on the list (incomplete handoff documentation suggests there may be more)

We will not refactor the Reports module as part of remediation. We fix what is broken; we document what we find that is out of scope for R1.

**Assumptions:**
- Meridian will share the eight logged defects at kickoff
- Fixes will be validated against real data in the existing JSON files (no database migration required)

---

## R2 — Restocking Recommendations

**The problem.** Operations staff — specifically R. Tanaka's team — are making replenishment decisions manually. The data to automate this already exists in the system: stock levels, demand forecasts, supplier spend. The capability just hasn't been built.

**Our approach.** We will build a new Restocking view as a first-class page in the existing dashboard, consistent with the current navigation and visual language. The view will:

- Accept an operator-supplied budget ceiling as input
- Pull current stock levels from `/api/inventory` and demand data from `/api/demand`
- Apply a configurable reorder threshold (stock below N days of demand triggers a recommendation)
- Generate a ranked purchase order list — highest-priority items first, with estimated cost
- Allow the operator to adjust quantities before exporting or acting on the recommendations
- Respect the existing warehouse and category filters so Tokyo and London teams see their own data

We will use Plan Mode during design to align on the data model and UI layout before building. The frontend component will follow Vue 3 Composition API patterns used throughout the existing codebase.

**Assumptions:**
- No integration with external procurement systems in this engagement (export as CSV or on-screen is sufficient)
- Demand forecast data already in `/api/demand` is treated as authoritative input
- Budget ceiling is a session-level operator input, not persisted to a database

---

## R3 — Automated Browser Testing

**The problem.** Your IT team cannot safely approve changes because there is no test coverage. This is a blocker for everything else — including the changes we're proposing in R1 and R2.

**Our approach.** We will establish end-to-end browser test coverage using Playwright, targeting all main dashboard views and critical user flows. Coverage will include:

| Flow | What we test |
|---|---|
| Inventory view | Load, filter by warehouse, filter by category, verify data renders |
| Reports view | All eight remediated defects have regression tests; all four filters functional |
| Restocking view | Budget input, recommendation generation, filter behavior |
| Orders view | Status filter, month filter, data accuracy |
| Dashboard summary | KPI cards render, no console errors |

Tests will run against the local development server (localhost:3000) and will be structured so Meridian's IT team can run them with a single command. We will document the test suite in plain language so non-developers can understand what each test covers.

**Why Playwright.** It tests the application as a user experiences it — in a real browser — and integrates with existing CI workflows. It produces readable failure output that your IT team can act on without needing to understand the internals.

**Assumptions:**
- Tests run against the existing local stack; no cloud CI infrastructure required in this engagement (though the tests will be portable to CI if Meridian chooses to add it later)

---

## R4 — Architecture Documentation

**The problem.** The previous vendor's handoff documentation is minimal. Meridian IT cannot maintain or safely extend a system they don't have a map of.

**Our approach.** As part of onboarding, we will produce a current-state architecture overview covering:

- System components and their responsibilities (frontend, backend, data layer)
- Data flow: how a user action in the browser becomes an API call, a filtered dataset, and a rendered result
- API surface: all endpoints, their parameters, and what they return
- Known technical debt and deviation from intended patterns (we will find things the handoff notes omit)
- Maintenance guidance: how to add a new view, how to add a new data field, how to run and extend the test suite

Format will be an HTML diagram suitable for screen sharing and printing — no proprietary tooling required to open or share it.

**Deliverable:** `architecture.html` — a self-contained document Meridian IT can reference without any vendor involvement.

---

## D1 — UI Modernization

We will refresh the visual design using Meridian's brand guide as the primary input. Our approach is additive: we update design tokens (colors, typography, spacing) globally so every view benefits, rather than redesigning page by page. We will propose a specific visual direction for client approval before implementing.

## D2 — Internationalization

The existing codebase has partial i18n infrastructure. We will extend it to cover all remaining hardcoded strings across all views, with Japanese as the primary new locale (Tokyo team). We will use the existing i18n library and patterns rather than introducing a new dependency.

## D3 — Dark Mode

We will implement operator-selectable dark mode using CSS custom properties scoped to a root theme class. The toggle will persist across sessions. We recommend prototyping this on a separate branch so it can be reviewed and merged independently — appropriate for a visual change that affects every view.

---

## What We Will Not Do

To keep scope honest: we will not migrate the JSON data layer to a database, build user authentication, integrate with external procurement or ERP systems, or redesign the information architecture of the existing views. Any of those could be a follow-on engagement.
