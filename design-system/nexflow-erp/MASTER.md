# NexFlow ERP - Official Design System Specification (MASTER)

> **AUTHORITY:** This is the master architectural design system specification for NexFlow ERP.
> All new frontend views, dialogs, forms, and analytical screens must adhere strictly to these tokens and component standards.
> Page-specific overrides are defined under `design-system/nexflow-erp/pages/[page-name].md`.

---

## 1. System Metadata & Design Dials
- **Platform:** Enterprise Web Application (B2B SaaS / Manufacturing Operations)
- **Primary Domain:** Discrete Manufacturing, E-Mobility & Production Planning
- **Design Style:** Data-Dense Dashboard (`data-dense-dashboard`) + Swiss Minimalism
- **Visual Density Dial:** `9 / 10` (High Information Density: 44px table rows, compact 38px inputs, 20px card padding)
- **Design Variance Dial:** `3 / 10` (Predictable, structured, minimal cognitive overhead for shop floor operators)
- **Motion Intensity Dial:** `2 / 10` (Subtle 150–200ms transitions, strictly no layout shifts or floating animations)
- **Accessibility Standard:** WCAG 2.2 Level AA Compliant (`contrast >= 4.5:1`, visible focus rings, keyboard navigable)
- **Unit System:** Exclusively SI / Metric (`kg`, `meters`, `liters`, `units`, `metric_tons`, `€`)

---

## 2. Centralized Design Tokens

### 2.1 Color Tokens

| Token Role | Hex Code | Tailwind / CSS Var | Purpose & Contrast |
|---|---|---|---|
| **Canvas Background** | `#F8FAFC` | `bg-slate-50` / `--color-bg-canvas` | Low-glare cool canvas for long shift operation |
| **Surface Card** | `#FFFFFF` | `bg-white` / `--color-bg-surface` | Crisp white content surfaces for cards & tables |
| **Surface Subtle** | `#F1F5F9` | `bg-slate-100` / `--color-bg-subtle` | Inactive tabs, table headers, disabled fields |
| **Surface Hover** | `#F8FAFC` | `hover:bg-slate-50/70` | Interactive table row hover state |
| **Border Default** | `#E2E8F0` | `border-slate-200` | 1px structural dividing lines |
| **Border Strong** | `#CBD5E1` | `border-slate-300` | Input borders, focused dividers |
| **Primary Navy** | `#0F172A` | `bg-slate-900` / `text-slate-900` | Sidebar navigation, primary headings (15.8:1) |
| **Primary Navy Accent** | `#1E293B` | `bg-slate-800` | Sidebar groups, dropdown containers |
| **Brand Interactive** | `#2563EB` | `bg-blue-600` / `text-blue-600` | Core action buttons, active pills, focused rings |
| **Brand Hover** | `#1D4ED8` | `hover:bg-blue-700` | Button hover state |
| **Text Primary** | `#0F172A` | `text-slate-900` | High-contrast data values, card titles (15.8:1) |
| **Text Secondary** | `#334155` | `text-slate-700` | Form labels, table cells, descriptions (8.9:1) |
| **Text Muted** | `#64748B` | `text-slate-500` | Metric units, timestamps, captions (4.6:1 AA) |

### 2.2 Semantic Status Matrix

| Semantic State | Background | Border | Text | Dot Color | Operational Meaning |
|---|---|---|---|---|---|
| **Success** | `#ECFDF5` (`bg-emerald-50`) | `#A7F3D0` (`border-emerald-200`) | `#047857` (`text-emerald-700`) | `#10B981` | Completed, In-Stock, Passed QA, Balanced |
| **Warning** | `#FFFBEB` (`bg-amber-50`) | `#FDE68A` (`border-amber-200`) | `#B45309` (`text-amber-700`) | `#F59E0B` | Pending Planning, Low Stock, Reorder Point, Idle |
| **Danger** | `#FFF1F2` (`bg-rose-50`) | `#FECDD3` (`border-rose-200`) | `#BE123C` (`text-rose-700`) | `#EF4444` | Critical Shortage, QA Rejected, Conflict, Out of Stock |
| **Info / Active** | `#EFF6FF` (`bg-blue-50`) | `#BFDBFE` (`border-blue-200`) | `#1D4ED8` (`text-blue-700`) | `#3B82F6` | In-Progress, Released, Scheduled, In Production |
| **Neutral** | `#F8FAFC` (`bg-slate-50`) | `#E2E8F0` (`border-slate-200`) | `#475569` (`text-slate-600`) | `#64748B` | Draft, Archived, Idle, Inactive |
| **Purple** | `#FAF5FF` (`bg-purple-50`) | `#E9D5FF` (`border-purple-200`) | `#7E22CE` (`text-purple-700`) | `#A855F7` | Shift Allocation, Cleanroom Sector, Calibration |

### 2.3 Typography Scale

- **Primary Sans:** `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Data / Monospace:** `"Fira Code", "Roboto Mono", SFMono-Regular, Menlo, monospace`
- **Tabular Numerics:** All metric quantities, financial valuations, and part numbers must use `.tabular-nums`.

| Token | Size | Line Height | Usage |
|---|---|---|---|
| `xs` | `0.75rem` (12px) | `1rem` (16px) | Badges, timestamps, metric suffixes, table captions |
| `sm` | `0.8125rem` (13px) | `1.125rem` (18px) | Form labels, table cells, secondary buttons |
| `base` | `0.875rem` (14px) | `1.25rem` (20px) | Standard body, form inputs, navigation items |
| `lg` | `1rem` (16px) | `1.5rem` (24px) | Modal headers, card titles, table headings |
| `xl` | `1.125rem` (18px) | `1.625rem` (26px) | Page section titles, module banner headers |
| `2xl` | `1.5rem` (24px) | `2rem` (32px) | KPI hero metric numbers, dialog headings |
| `3xl` | `1.875rem` (30px) | `2.25rem` (36px) | Executive dashboard display numbers |

---

## 3. Standardized Component Specifications

### 3.1 Sidebar & Navigation Standards
- **Container:** Dark Navy (`bg-slate-900`) with subtle separator (`border-slate-800`).
- **Width:** `260px` expanded, `72px` collapsed.
- **Active Navigation Item:** `bg-blue-600 text-white font-medium shadow-xs`.
- **Inactive Item:** `text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors`.
- **Badges on Nav:** Small pill badge (`px-1.5 py-0.2 rounded-full text-[10px]`) showing active counts (e.g., pending demand orders, low stock items).
- **Collapsible Toggle:** Accessible chevron button with `aria-label="Expand sidebar"`.

### 3.2 Dashboard KPI Cards (`StatCard`)
- **Structure:** Crisp white surface (`bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs`).
- **Header:** Uppercase 11px label (`text-slate-500 font-semibold tracking-wider`) with rounded colored icon badge.
- **Metric Row:** Large bold metric (`text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums`) with trailing uppercase SI unit (`kg`, `units`, `€`, `%`).
- **Footer:** Subtitle text + trend indicator badge (emerald for positive/target met, rose for below threshold, amber for warning).

### 3.3 Data Tables (`Table`)
- **Density:** High Information Density (row height ~44px, cell padding `px-4 py-3`).
- **Header:** Sticky header, subtle slate fill (`bg-slate-50/80 border-b border-slate-200`), uppercase 11px text (`text-slate-600 font-semibold`).
- **Sorting:** Accessible button with `aria-sort="ascending|descending"` and directional chevron indicator.
- **Cells:** Whitespace nowrap with ellipsis on overflowing text. Numbers right-aligned or mono-spaced.
- **Empty State:** Centered illustration icon + bold message + "Clear filters" shortcut.
- **Footer Toolbar:** Shows record range (`Showing 1 to 25 of 140 entries`), page size selector (`10`, `25`, `50`, `100`), and accessible prev/next pagination controls.

### 3.4 Forms and Inputs (`FormInput`, `FormSelect`, `FormTextarea`)
- **Labeling:** Explicit `<label htmlFor={inputId}>` with required asterisk in red (`*`).
- **Input Surface:** `border border-slate-300 rounded-lg bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs`.
- **Focus Ring:** `focus:outline-none focus:ring-2 focus:ring-blue-500`.
- **SI Unit Suffix:** Fixed right-side badge (`pr-14` input with absolute `text-xs font-medium text-slate-400` badge) for metric quantities (`kg`, `m`, `L`, `units`, `€`).
- **Error Feedback:** Red border (`border-rose-300 text-rose-900 focus:ring-rose-500`) with `<p role="alert">` linked via `aria-describedby`.

### 3.5 Modals & Confirmation Dialogs (`Modal`, `ConfirmDialog`)
- **Backdrop:** High-contrast slate overlay (`bg-slate-900/60 backdrop-blur-xs z-50`).
- **Surface:** Centered white card (`rounded-xl border border-slate-200 shadow-xl overflow-hidden`).
- **A11y:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap on open, and auto-restoration of previous focus on close.
- **Dismissal:** Escape key listener + top-right close button (`X`) + backdrop click.
- **Header & Footer:** Muted slate header (`bg-slate-50/80 px-6 py-4`) and action footer with Secondary Cancel + Primary/Danger Action.

### 3.6 Status Badges (`Badge`)
- **Format:** Pill container (`rounded-full font-medium border text-xs tracking-wide shadow-2xs`).
- **Dot Indicator:** 6px circular dot (`rounded-full bg-current opacity-75 mr-1.5`) matching the status color.
- **Sizes:** `sm` (`text-[11px] px-2 py-0.5`) and `md` (`text-xs px-2.5 py-1`).
- **Semantic Resolver:** Integrated with `getStatusToken(status)` supporting all 20 modules without hardcoding hex strings in components.

### 3.7 Charts & Analytics (`ChartContainer`)
- **Container:** Standardized card with title, context summary tag, and optional live data table toggle.
- **Recharts Tokens:**
  - Blue (`#2563eb`) for Actual Output
  - Amber (`#f59e0b`) for Target Benchmark
  - Emerald (`#10b981`) for Quality Yield
  - Rose (`#ef4444`) for Scrap / Defects
- **Direct Series Legend:** Standard legend items placed directly beneath chart with color chip and description.
- **Accessibility:** Includes button to toggle between visual chart and accessible tabular data table.

### 3.8 Filters and Search Bars (`FilterBar`)
- **Search:** Search input with leading magnifying glass and instant `X` clear button.
- **Modular Selectors:** Dropdown filters for Category, Warehouse, Work Center, and Status.
- **Reset Button:** Shows active count (`Reset (2)`) when filters diverge from default.
- **Actions Slot:** Houses Primary CTA (e.g. `+ Add Product`, `+ Create Order`) aligned to the right.

---

## 4. Development Rules for New Modules
1. **Import from Design System:**
   ```javascript
   import { tokens, getStatusToken, DS_CLASSES } from '../design-system';
   import { Table, StatCard, Badge, Button, FormInput, Modal, FilterBar, ChartContainer } from '../components';
   ```
2. **Never hardcode arbitrary hex colors:** Use Tailwind semantic classes or `tokens.colors.*`.
3. **Always pair numbers with SI units:** Exclusively metric (`kg`, `meters`, `liters`, `units`, `€`).
4. **Never disable focus outlines:** Maintain `focus-visible:ring-2 focus-visible:ring-blue-500`.
5. **Preserve Hot Module Replacement:** Keep `.jsx` files strictly for React components and export custom hooks from `.js` files.
