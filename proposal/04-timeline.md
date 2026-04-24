# Timeline

**RFP #MC-2026-0417 — Meridian Components**

---

## Approach

We deliver in phases, not at the end. Each phase closes with working software you can see and test — not a status report. The required items (R1–R4) are complete by Week 6. Desired items (D1–D3) follow in Weeks 7–10 if included in scope.

Assumes contract execution by **May 19, 2026** (allowing time for RFP evaluation and award).

---

## Phase 1 — Onboarding & Architecture (Weeks 1–2)

*Goal: we understand the system as it actually is, and Meridian has documentation that reflects reality.*

| Week | Deliverables |
|---|---|
| 1 | Environment setup and validation; kickoff with Meridian IT and Operations; obtain defect list for R1 |
| 1 | Codebase audit — map actual state vs. handoff notes; identify undocumented gaps |
| 2 | **R4 delivered:** Architecture documentation (`architecture.html`) — reviewed and accepted by Meridian IT |
| 2 | R1 defect reproduction complete; remediation plan confirmed with Meridian |

**Milestone:** Architecture doc accepted. Defect list confirmed. No surprises going into Phase 2.

---

## Phase 2 — Reports Remediation & Test Foundation (Weeks 3–4)

*Goal: Reports module works correctly; IT's test coverage requirement is addressed.*

| Week | Deliverables |
|---|---|
| 3 | **R1 delivered:** All eight defects resolved; regression tests written for each fix |
| 3–4 | **R3 in progress:** Playwright test suite built for existing views (Inventory, Orders, Dashboard) |
| 4 | **R3 delivered:** Full test suite covering all main views and critical flows; documented run instructions |

**Milestone:** Reports module sign-off from Operations. Test suite approved by IT. IT unblocked to review future changes.

---

## Phase 3 — Restocking Feature (Weeks 5–6)

*Goal: Operations team has the data-driven purchase order tool they've been waiting for.*

| Week | Deliverables |
|---|---|
| 5 | Restocking view: data model, API endpoint, Vue component scaffolded; mid-week demo to R. Tanaka |
| 5 | Restocking view: budget input, ranked recommendations, warehouse/category filtering |
| 6 | **R2 delivered:** Restocking view complete with Playwright test coverage; Operations team walkthrough |
| 6 | End of required scope: all R1–R4 items delivered and accepted |

**Milestone:** R2 accepted by Operations. All required items complete. **Required delivery: ~June 26, 2026.**

---

## Phase 4 — Desired Items (Weeks 7–10) *(if in scope)*

| Week | Deliverables |
|---|---|
| 7–8 | **D1:** UI refresh per Meridian brand guide — design proposal in Week 7, implementation in Week 8 |
| 7–8 | **D2:** i18n extension — Japanese locale for Tokyo team; all modules covered |
| 9–10 | **D3:** Dark mode — prototyped on separate branch, reviewed, merged |
| 10 | Final QA pass; handoff documentation updated; retrospective with Meridian IT |

**Full delivery: ~July 24, 2026.**

---

## Risk & Schedule Notes

**What could slow us down:**
- Defect list reveals more than eight issues in Reports — we will flag immediately and discuss scope adjustment before proceeding
- Meridian stakeholder availability for reviews — we ask for 1-hour weekly touchpoints with Operations and IT
- Brand guide delivery for D1 — we need it before Week 7 to stay on schedule

**What keeps us on track:**
- We scope from actual code, not documentation, so we don't encounter "surprises" that other vendors might
- Fixed-fee engagement means we have every incentive to stay efficient
- Phased delivery means problems surface early, not at the end

---

*Timeline is based on a 2-person team. Additional resource can be added for D1–D3 if parallel delivery is preferred.*
