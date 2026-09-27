<div align="center">

# 🏡 Dreams to Doorstep: Homeownership Portal

**Empowering Your Journey to Homeownership**

A token-based client portal and coach dashboard for a homeownership readiness program, built entirely on
Google Apps Script with Google Sheets as the database. Financial coaches capture buyer finances through
intake and update forms, every buyer gets a personalized portal link generated automatically, and a
per-loan-program readiness engine turns credit and debt numbers into a clear 0 to 100 score.

No servers, no build pipeline, no monthly hosting bill: deploy the script, connect a spreadsheet, and go.

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8-4285F4?logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![Google Sheets](https://img.shields.io/badge/Backend-Google%20Sheets-34A853?logo=googlesheets&logoColor=white)](https://sheets.google.com)
[![clasp](https://img.shields.io/badge/Dev%20Workflow-clasp-FFB300?logo=npm&logoColor=white)](https://github.com/google/clasp)
[![Alpine.js](https://img.shields.io/badge/UI-Alpine.js%203-77C1D2)](https://alpinejs.dev)
[![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org)
[![jQuery](https://img.shields.io/badge/DOM-jQuery%203-0769AD?logo=jquery&logoColor=white)](https://jquery.com)

[Repository](https://github.com/Mahmudul-Hasan-Shawon/Dreams-to-Doorstep-Home-Readiness-Report-Intake)

</div>

---

## ✨ Features

### 🧭 Coach Dashboard

| Feature | Details |
|---|---|
| Buyer roster | Scrollable table of every buyer with name, start date, and a color-coded credit score |
| Live search | Filter buyers by name, email, phone, or portal token as you type |
| One-click portals | Open any buyer's personalized portal directly from the roster |
| Admin authentication | PIN-gated access with a 1 hour session remembered in `localStorage` |
| Quick tips panel | Built-in guidance for new applications and client updates |

### 📝 Buyer Intake

| Feature | Details |
|---|---|
| Real-time DTI | Front-end and back-end debt-to-income ratios update as you type, with color thresholds at 36% and 43% |
| Field validation | Credit score bounded to 300 to 850, positive income and home price, non-negative debts |
| Automatic portal link | Submitting the form generates a unique portal URL and writes it back to the sheet |
| Formula propagation | Spreadsheet formulas (totals, readiness score, progress bar) are copied into the new row |

### ✏️ Buyer Update

| Feature | Details |
|---|---|
| Buyer picker | Select2 searchable dropdown listing every buyer with row number and portal status |
| Pre-filled form | Selecting a buyer loads their current values for editing |
| Forced recalculation | Formula cells are reset and re-applied so scores refresh immediately after an update |
| Portal safety | The buyer's existing portal URL is preserved and returned on success |

### 🔐 Client Portal (token based)

| Feature | Details |
|---|---|
| Personal link | Each buyer has a secret `?t=<token>` URL; no login required |
| Financial snapshot | Stat cards for credit score, monthly income, readiness score, current debt, target home price, and estimated mortgage |
| Chart.js visuals | Doughnut chart of income vs debt vs remaining income, plus an affordability analysis chart |
| Loan readiness table | Score for every loan program with credit and DTI breakdowns and a status badge |
| Progress milestones | Animated readiness progress bar with completed and current milestones |
| Coach touchpoints | Coach notes and summary/recommendations rendered straight from the sheet |
| Lender partners | Trusted lender partner grid plus a program highlight linking to the public program page |

### 🧮 Readiness Scoring Engine

| Feature | Details |
|---|---|
| Sheet-driven rules | Loan programs (name, max DTI, min credit score) are read from the `Loan Planner` tab, so coaches can add or edit programs without touching code |
| 0 to 100 scoring | Credit and DTI each contribute up to 50 points per program; missing a program minimum scores 0 for that component |
| Pass/fail gating | A credit score below the program minimum or a DTI above the program cap zeroes that component |
| Clear labels | 80+ is an Excellent Match, 60+ a Good Candidate, anything lower Needs Improvement |
| 40% affordability rule | Maximum comfortable housing payment is estimated at 40% of gross monthly income |

### ⚙️ Admin and Configuration

| Feature | Details |
|---|---|
| Settings sheet | Admin PIN, form password, and protection toggles stored in the spreadsheet, editable without code |
| Spreadsheet menu | A `Portal Admin` menu in the sheet for utility actions |
| URL backfill | One prompt-driven run generates portal URLs for every existing row |
| Form trigger | An installable `onFormSubmit` trigger stamps portal URLs on Google Form submissions too |

---

## 🏗️ Architecture

```text
                        ┌───────────────────────────────────────────────┐
                        │              Google Apps Script               │
                        │                                               │
   Buyer ─── ?t=token ─►│  doGet(e) ──► token lookup ──► Page.html      │
                        │     │                          (client view)  │
   Coach ──────────────►│     │                                         │
                        │     └──────────► Dashboard.html (Alpine.js)   │
                        │                    ├─ IntakeForm.html         │
                        │                    └─ UpdateForm.html         │
                        │                          │                    │
                        │              google.script.run                │
                        │                          │                    │
                        │   getAllBuyersData · getClientDataForToken    │
                        │   handleIntake · handleUpdate                 │
                        │   verifyAdminPin · generateLoanScores         │
                        └──────────────┬────────────────────────────────┘
                                       ▼
                            ┌─────────────────────┐
                            │    Google Sheets    │
                            │ ├─ Form Responses 1 │  buyer data + sheet formulas
                            │ ├─ Settings         │  admin PIN, form password, toggles
                            │ └─ Loan Planner     │  loan program rules (A/B/C)
                            └─────────────────────┘
                                       ▲
                    Google Form ── onFormSubmit trigger ── portal URL stamping
```

Everything runs inside one Apps Script project. `doGet` is the single router: a `t` query parameter
renders that buyer's portal from `Page.html`, anything else renders the coach dashboard from
`Dashboard.html`, which pulls `IntakeForm.html` and `UpdateForm.html` in as partials. The client side
talks to the sheet only through `google.script.run`, and heavy calculations (readiness scores, loan
program matching) stay server side so the portal always shows sheet-accurate numbers. Sheet formulas
(total debt, readiness score, progress bar) are preserved and re-seeded onto new or updated rows, so
the spreadsheet remains just as usable as the web app.

---

## 📁 Project Structure

```text
Dreams to Doorstep/
├── Code.js              # Server side: routing (doGet), scoring engine, CRUD, auth, triggers
├── Dashboard.html       # Coach shell: navigation tabs, buyer roster, admin PIN modal
├── IntakeForm.html      # Buyer intake with live front/back-end DTI calculator
├── UpdateForm.html      # Buyer update with Select2 buyer search and formula refresh
├── Page.html            # Client portal: stat cards, Chart.js visuals, loan readiness table
├── AlpineSetup.html     # Alpine stores (appStore, formStore): state, auth, validation, math helpers
├── DesignSystem.html    # EXIT Realty teal design tokens (colors, gradients, typography)
├── appsscript.json      # Apps Script manifest: V8 runtime, web app access, timezone
└── .clasp.json          # clasp config binding this folder to the Apps Script project
```

---

## 🛠️ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Runtime | Google Apps Script (V8) | Server logic, web app hosting, triggers |
| Database | Google Sheets | Buyer records, settings, loan program rules |
| UI framework | Alpine.js 3 | Reactive views and centralized app store |
| Charts | Chart.js | Income/debt doughnut and affordability visuals |
| DOM / forms | jQuery 3.7 + Select2 4.1 | Buyer picker and form wiring in the update flow |
| Notifications | Toastr + Animate.css | Toasts and entrance animations |
| Icons / fonts | Boxicons, Google Fonts (Lato) | Iconography and typography |
| Dev workflow | clasp | Local editing, `push`/`pull` with the Apps Script project |

---

## 🚀 Getting Started

### Prerequisites

- A Google account with access to Google Drive and Google Sheets
- [Node.js](https://nodejs.org) and [clasp](https://github.com/google/clasp) for local development:
  `npm install -g @google/clasp`
- The Google Sheet behind the portal, with these tabs:

| Tab | Purpose | Key contents |
|---|---|---|
| `Form Responses 1` | Buyer database | `Timestamp`, `Buyer Name`, `Start Date`, `Email Address`, `Phone Number`, `Credit Score`, `Monthly Income (before taxes)`, `Current Monthly Debt`, `Target Home Price`, `Estimated Monthly Payment (PITI)`, `Notes or Coaching Comments`, formula columns (`Readiness Score`, `Progress Bar`, `Summary / Recommendations`), `Portal URL` |
| `Settings` | Security config | `B1` = Admin PIN, `B2` = protection toggle, plus `FORM_PASSWORD` / `PASSWORD_ENABLED` key-value rows |
| `Loan Planner` | Scoring rules | Column A = program name, Column B = max DTI (decimal, e.g. `0.5`), Column C = min credit score |

### Install and connect

```bash
# Authenticate clasp with your Google account
clasp login

# Option A: clone the existing Apps Script project
clasp clone 198qciM_nvbdoANilfRYBXF7EFZRA50CgWrulkh0vc6G6-xb1A2bDMUES

# Option B: push local edits to the bound project
clasp push
```

### First-run configuration

1. **Deploy the web app** (see [Deployment](#deployment)) and copy the `.../exec` URL.
2. **Set the web app URL**: in the Apps Script editor, open Project Settings, add a Script Property
   `WEB_APP_URL` with the `/exec` URL. Portal links are built from this value.
3. **Set the Admin PIN**: put your PIN in the `Settings` tab, cell `B1`.
4. **Review protection toggles**: `B2` (and the `PASSWORD_ENABLED` row) controls whether coach features
   require authentication. The default form password (`Coach2024!`) applies only if the `Settings`
   sheet is missing; set a real `FORM_PASSWORD` row before going live.
5. **Backfill existing rows**: in the spreadsheet, run `Portal Admin > Backfill Portal URLs` once so
   every existing buyer gets a portal link.

### Local development loop

```bash
clasp push          # send local .js/.html/.json changes to Apps Script
clasp pull          # pull changes made in the online editor
clasp open          # open the Apps Script editor in your browser
```

There is no build or test step: the HTML files are served as-is by `HtmlService`, and `Code.js` runs
on the Apps Script V8 runtime. After pushing, refresh the deployed web app URL to verify changes
(redeploy if your deployment is configured to pin a specific version).

---

## 📦 Deployment

The app deploys as a Google Apps Script Web App (per `appsscript.json`: executes as the deploying
user, accessible to anyone anonymously, V8 runtime, America/Chicago timezone).

1. In the Apps Script editor (or via `clasp open`), choose **Deploy > New deployment**.
2. Select type **Web app**.
3. Set **Execute as**: *Me* and **Who has access**: *Anyone*.
4. Deploy and copy the Web App URL (ends in `/exec`).
5. Store that URL as the `WEB_APP_URL` Script Property so portal link generation works.
6. Run `Portal Admin > Backfill Portal URLs` in the spreadsheet for any rows created before this step.

> **Note:** clients only need the tokenized URL (`.../exec?t=<token>`), so sharing a deployment link
> never exposes the coach dashboard. Coach views are additionally gated by the Admin PIN.

---

## 🔌 Server API Overview

All client-to-server communication goes through `google.script.run` calls defined in [Code.js](Code.js).

| Function | Called from | Purpose |
|---|---|---|
| `getAllBuyersData()` | Dashboard | Roster data for every buyer, including tokens and portal URLs |
| `getClientDataForToken(token)` | Portal views | Full buyer row (safely serialized) for a portal token |
| `handleIntake(formData)` | Intake form | Appends a validated row, copies formulas, generates the portal URL |
| `handleUpdate(formData)` | Update form | Writes changed fields to the existing row and forces formula recalculation |
| `verifyAdminPin(pin)` | Auth modal | Compares the entered PIN against `Settings!B1` |
| `isPasswordProtectionEnabled()` | App init | Reports whether coach features require authentication |
| `generateLoanScores(client)` | `Page.html` | Builds the per-program readiness table HTML from `Loan Planner` rules |
| `getWebAppUrl()` | Portal | Returns the deployed web app base URL |

<details>
<summary><strong>Full server function reference</strong> (source of truth: <a href="Code.js">Code.js</a>)</summary>

| Function | Kind | Description |
|---|---|---|
| `doGet(e)` | Web hook | Router: token param renders the client portal, otherwise the dashboard |
| `onFormSubmit(e)` | Trigger | Stamps a generated portal URL onto Google Form submissions |
| `onOpen()` | Trigger | Adds the `Portal Admin` spreadsheet menu |
| `include(filename)` | Template helper | Inlines an HTML partial into a template |
| `getAllBuyersData()` | Data read | Normalized buyer list for the dashboard roster |
| `getBuyers()` | Data read | Alternate buyer listing used by the update form |
| `getClientDataForToken(token)` | Data read | Buyer row lookup by portal token |
| `getClientDataForTokenWrapper(token)` | Data read | Logging-heavy variant of the token lookup |
| `checkPortalUrlsSimple(token)` | Debug | Reports whether a token exists in any Portal URL cell |
| `handleIntake(formData)` | Write | Creates a buyer row with formulas and portal URL |
| `handleUpdate(formData)` | Write | Updates a buyer row and refreshes formula cells |
| `verifyAdminPin(pin)` | Auth | PIN check against the Settings sheet |
| `isPasswordProtectionEnabled()` | Auth | Protection toggle check |
| `validateFormPassword(password)` | Auth | Form password check (no-op when protection is off) |
| `getSetting(name)` / `updateSetting(name, value)` | Settings | Key-value settings access on the Settings sheet |
| `generateLoanScores(client)` | Scoring | Per-program readiness table for the client portal |
| `calculateReadinessScore(credit, dti, price, program)` | Scoring | Weighted 0-100 score: credit /50 + DTI /50 with pass/fail gating |
| `getLoanProgramsFromPlanner()` | Scoring | Reads loan program rules from the Loan Planner tab |
| `backfillPortalUrlsForExistingRows()` | Utility | Prompt-driven portal URL generation for all existing rows |
| `generateTokenFromTimestamp_(ts)` | Utility | Token = base36 timestamp + random suffix |
| `getDeploymentBaseUrl_()` | Utility | Reads `WEB_APP_URL` from Script Properties |
| `copyFormulasToNewRow_(sheet, row)` | Utility | Re-seeds formula columns onto new rows |
| `formatDateForDisplay_(date)` | Utility | Locale date formatting for roster display |

</details>

---

## 💭 Why "Dreams to Doorstep"

The name is the program's promise: walking first-time buyers from the dream of owning a home to the
 doorstep of signing. Coaches needed one place to capture a buyer's finances, score them against real
 loan program requirements, and hand each buyer a private link that always shows their latest numbers.
 Building it on Google Apps Script means the entire system lives in tools the program already uses
 (Sheets and Forms), so a coach can adjust loan rules, change the PIN, or review raw data without ever
 opening an IDE.

This repository is a maintained build of that system: the readiness math, live data rendering, and
 the overall UI/UX have been reviewed and corrected so the portal reflects real spreadsheet values
 accurately.

<div align="center">

<sub>Built with Google Apps Script · Data stays in your spreadsheet · One deployment, zero servers</sub>

</div>
