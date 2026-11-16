# Remitra web application (Phase 1)

*Your friend on the way to remission.*

A working web version of the Remitra prototype described in `Remitra-Prototype-Developer-Guide.docx`. It links what a person eats to how their autoimmune disease behaves, using a 70-day **synthetic** history for the demo persona **Maya (rheumatoid arthritis)**.

> **Phase rule:** this is Phase 1 (web only). The Android/iOS app (Phase 2) has not been started and will not be started without explicit approval.

> **No real health data.** Everything shown is synthetic demonstration data. This is not medical advice and not a medical device.

## Quick start

Requirements: Node.js 23.6 or newer (the API server runs TypeScript directly). Tested on Node 26.

```bash
npm install
npm run dev
```

Open http://localhost:5173. `npm run dev` starts two processes:

| Process | Port | What it does |
|---|---|---|
| Web (Vite + React) | 5173 | The app |
| API (Node, `server/index.ts`) | 8787 | USDA and Open Food Facts proxy, FHIR validation. Vite forwards `/api/*` to it |

Optional: copy `.env.example` to `.env` and set `USDA_API_KEY` (free at https://fdc.nal.usda.gov/api-key-signup). Without it, the shared `DEMO_KEY` is used, which allows only about 30 lookups an hour. When the limit is hit, the app falls back to clearly labeled offline estimates.

Other scripts:

```bash
npm test          # unit tests (scoring, parsing, insights, FHIR validator)
npm run typecheck # TypeScript
npm run build     # production build into dist/
```

The earlier single-file prototype is kept in `legacy-prototype/`.

## What's in the app

Navigation: **Today · Log · Insights · Trends · Care team**, plus Ask Remitra, Test It, Flare outlook, Daily check-in, Labs, Wearables, Settings and Privacy (sidebar on desktop, bottom tabs and top bar on mobile).

| Guide item | Where | Notes |
|---|---|---|
| Onboarding and consent (F10, screen 1) | `/welcome` | 4 steps; guest or demo account; separate consents; research off by default |
| Today (screen 2) | `/today` | Flare outlook, quick log, check-in, overview, sleep, activity, meals, insights, quick actions |
| Multimodal meal logging (F1, A1, screen 3) | `/log/meal/:mode` | Photo, voice, barcode, typed, repeat; edit every item; nothing saved before **Confirm meal**; edit and delete from Log |
| Daily check-in (F2, screen 4) | `/log/checkin` | 7 daily items (0 to 10, keyboard and voice), weekly RAPID3, Crohn's HBI patient items, PROMIS-29 placeholder |
| Wearables (F3) | `/wearables` | Synthetic sleep, resting HR, HRV, steps; Apple Health and Health Connect connection previews |
| Labs (F4, A2, screen 5) | `/log/labs` | Manual entry with validation, report photo OCR, sample report, confirm each value, history chart |
| Personal insights (F5, A3, screen 6) | `/insights` | Computed live from stored logs; "associated with" wording; Likely / Possible / Not enough data |
| Ask Remitra (F8, A7, screen 7) | `/insights/ask` | Answers from the user's data with sources; refuses diagnosis and medication questions; red-flag escalation |
| Test It (F6, A4, screen 8) | `/insights/test-it` | A-B-A-B plan, clinician-agreement gate, progress, adherence, results, stop any time |
| Flare outlook (F7, A5) | `/flare` | 7-day outlook, contributing factors, 60-day history with flares |
| Trends (screen 9) | `/trends` | Symptoms, disease activity (RAPID3 bands), sleep, nutrition, meals, biomarkers, flares; 7/30/90 days or a custom range; table alternatives |
| Care team report (F9, screen 10) | `/care` | Preview, PDF download, FHIR R4 bundle with validation, simulated 7-day links you can revoke |
| Settings | `/settings` | Profile, conditions, versioned consent, research opt-in, JSON/FHIR/CSV export, accessibility, access log, reset, delete |

## Real, simulated and deferred

| Capability | Status | Detail |
|---|---|---|
| Nutrient lookup | **Real** | USDA FoodData Central (via the API proxy, else the browser with DEMO_KEY); offline estimates when unavailable, labeled |
| Barcode lookup | **Real** | Camera scan or photo (html5-qrcode) or typed number, looked up in Open Food Facts |
| Meal photo recognition | **Real but limited** | MobileNet v2 runs in the browser. It knows about 50 foods and names one main item, so the user confirms everything. Planned: a vision-language model on Amazon Bedrock |
| Voice input | **Real, browser-dependent** | Web Speech API (Chrome sends audio to Google). Typed fallback everywhere |
| Lab report reading | **Real but basic** | Tesseract.js OCR plus a pattern parser for CRP, ESR, fecal calprotectin, vitamin D. Unclear values are flagged, never guessed. "Sample report" is simulated and labeled |
| Insights engine | **Demo analysis** | Bayesian comparison of means with shrinkage, lags 0 to 2, penalty for testing several lags, minimum-data rule. Not adjusted for confounders. Planned: hierarchical regression |
| Flare outlook | **Simulated** | Hand-set score over recent trends. Labeled "Prototype estimate based on synthetic data". Not trained or validated |
| Ask Remitra | **Simulated** | Rule-based responder that computes answers from stored data. Not a language model |
| RAPID3 | **Demo scoring** | Correct cut-offs; "function" is one 0 to 10 item instead of the 10-item MDHAQ until licensing and wording are confirmed |
| Harvey-Bradshaw | **Partial** | Patient items only; abdominal-mass item needs a clinician |
| PROMIS-29 | **Deferred** | Workflow step shown, no items, until licensing and approved wording are confirmed |
| Wearables | **Simulated** | Synthetic data. Browsers cannot read HealthKit or Health Connect; Phase 2 mobile app |
| Passkey sign-in | **Simulated** | No account is created. Planned: Amazon Cognito |
| PDF report | **Real** | jsPDF with a text layer, title and language set. Full tagged-PDF and SureAccess scan still to do |
| FHIR R4 bundle | **Real (demo codes)** | Patient, Condition (SNOMED CT), lab and wearable Observations (LOINC), RAPID3 and symptoms (internal codes), MedicationStatement, Consent. Structural validator in app and API; not the official HL7 validator |
| Secure share links | **Simulated** | Created, copied, revoked and expired locally; not hosted |
| Storage | **Demo** | Browser localStorage. Planned: Node API plus AWS HealthLake |

## Project structure

```
src/
  types.ts              domain types (FHIR-friendly, reusable by React Native)
  data/                 synthetic persona generator, food table, conditions
  lib/                  dates, instrument scoring, text parser
  services/             analytics (insights, flare), nutrition, vision, labs OCR,
                        ask, fhir builder, fhir validator, report (PDF)
  store/                state + localStorage persistence, derived hooks
  components/           UI kit (ui.tsx), app shell, capture (camera, barcode, speech)
  pages/                one file per screen
server/index.ts         Node API (no framework)
tests/core.test.ts      unit tests
legacy-prototype/       earlier single-file prototype
```

Pure logic (`data/`, `lib/`, `services/analytics.ts`, `services/fhirValidate.ts`, `services/labs.ts` parser) has no React dependency so it can move to the API server or a React Native app. Store actions are named (`addMeal`, `saveCheckin`, `setConsent`, …) so they can be backed by real API calls later.

## Testing done

- `npm test`: 7 unit tests pass (RAPID3 cut-offs, HBI, food parser, lab parser including the "25-OH" case, deterministic persona, insights recover the planted sugar→pain and late-dinner→sleep patterns and report dairy as "Not enough data", FHIR validator).
- `npm run typecheck` and `npm run build` pass.
- In the browser: every route loads with no console errors; onboarding; check-in updates Today and Trends; typed meal created, edited and deleted; photo upload recognized a real banana photo; barcode lookup; lab sample review with a flagged unit, confirm and save; manual lab validation; Test It gate, start and stop; Ask Remitra answers, refusal and urgent guidance; PDF and FHIR downloads (382 resources, 0 errors); share link create and revoke; consent changes (research modal, wearable off hides data); text-size preference; exports.
- No horizontal scrolling at 375 px on any page; desktop layout checked at 1366 px.

## Known limitations

- Camera and microphone could not be tested inside the development preview pane (blocked there). Test them in Chrome at http://localhost:5173 and allow access.
- The shared USDA DEMO_KEY runs out quickly; add a free personal key for demos.
- First photo recognition downloads the model (about 15 MB); first OCR downloads English language data.
- Insights are unadjusted; the flare outlook and Ask Remitra are simulations. None of these are clinically validated.
- Screen-reader testing with VoiceOver/TalkBack and a SureAccess scan have not been done yet; components use labels, roles, focus management and table alternatives for charts.
- LOINC and SNOMED codes should be re-verified against current releases; instrument licensing (PROMIS, RAPID3/MDHAQ) is pending.
- The main JavaScript chunk is about 290 KB gzipped; route-level code splitting is a possible improvement.
- Data lives in one browser; clearing site data resets the demo.
