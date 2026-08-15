# 📄 design.md — AgroCare AI Front-End Design Specification & Upgrade Plan

## 1. Project Overview
- **Project Name:** AgroCare AI Final APP (Smart Agro-Assistant)
- **Application Type:** Mobile-First Responsive Full-Stack Web App (React 18 + Vite + Tailwind CSS + Gemini AI)
- **Core Purpose:** Empowers farmers and agricultural workers with instant AI-driven crop leaf disease diagnosis, local mandi market commodity pricing, weather micro-advisories, and verified agricultural input store locator (Agro Kendra).
- **Unique Value Proposition:** Offline-friendly design, multi-lingual voice audio guidance (English, Hindi, Kannada), instant visual scan feedback with organic/chemical treatment breakdowns, and localized supplier mapping.

---

## 2. Target Audience
- **Primary Users:** Smallholder & commercial farmers, field agronomists, rural agricultural workers (ages 20–65).
- **Secondary Users:** Agro-input retailers, local krishi kendras, agricultural extension officers.
- **User Pain Points:** Limited high-speed internet, language barriers, complex chemical terminology, delay in expert crop treatment advice.
- **User Expectations:** High-contrast sunlight-readable UI, large touch targets (≥48px), 1-tap AI scan, spoken voice responses, simple navigation without deep nested menus.

---

## 3. Current State Analysis (Audit)

| Aspect | Current Implementation | Audit Findings & Recommendations |
| :--- | :--- | :--- |
| **Visual Theme** | Emerald green accents (`emerald-600`/`700`), warm slate background | High legibility in daylight. Add high-contrast mode toggle and ambient subtle field patterns. |
| **Navigation** | Sticky Top Bar + Bottom Navigation Dock | Excellent thumb zone access on mobile. Add active indicator motion animations. |
| **AI Scanner Hub** | Live video stream + Drag & drop upload + Quick Demo Scan pills | Responsive HUD with scanning ray. Upgraded button feedback and touch active states. |
| **Diagnostic Report** | Severity pill, voice audio player, treatment toggle, interactive map | Clear layout. Ensure mathematical nesting of card radii and text contrast compliance. |
| **Mandi & Weather** | Horizontal scrolling metric cards & price lists | Clean layout. Add real-time price trend indicators (up/down sparklines). |

---

## 4. Design System Specification

### 4.1 Color Palette

| Category | Token / Class | Hex Code | Usage / Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | `emerald-600` | `#059669` | Primary CTA buttons, active tab indicators, brand headers |
| **Primary Dark** | `emerald-900` | `#064e3b` | High contrast headings, dark card backgrounds |
| **Secondary Accent** | `amber-500` | `#f59e0b` | Warnings, disease severity highlights, star ratings |
| **Neutral Background** | `stone-50` / `emerald-50/30` | `#fafaf9` | Daylight-friendly background canvas |
| **Card Surface** | `white` | `#ffffff` | Primary container surface with `border-gray-100` |
| **Text Primary** | `gray-900` / `earth` | `#111827` | Headings and high legibility body copy |
| **Text Muted** | `gray-500` | `#6b7280` | Subtitles, metadata, timestamps |
| **Semantic Success** | `green-600` | `#16a34a` | Healthy crop status, in-stock badges |
| **Semantic Danger** | `red-600` | `#dc2626` | High severity crop infection, critical alerts |

### 4.2 Typography & Spacing
- **Font Pairings:** `Plus Jakarta Sans` / `Inter` (sans-serif) for high digital readability on all screens.
- **Heading Scale (Ratio 1.25):**
  - `H1`: 28px–32px (Bold/Black) — Screen titles
  - `H2`: 20px–24px (Bold) — Section headers
  - `H3`: 16px–18px (Semi-Bold) — Card titles
  - `Body`: 14px–16px (Regular/Medium) — Diagnostic instructions & treatments
  - `Caption/Badge`: 11px–12px (Bold/Uppercase) — Status badges & tags
- **Spacing System:** 8px base grid (`p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px).
- **Corner Radius:** Outer containers `28px`–`36px`, Inner cards `16px`–`20px`, Control buttons `12px`–`16px`.

---

## 5. UI Structure & Layout Hierarchy

```
┌────────────────────────────────────────────────────────┐
│ 🔝 Top Bar: Brand Logo, Voice Assistant, Language Switch│
├────────────────────────────────────────────────────────┤
│ 🟢 Main Viewport (Dynamic Route):                       │
│  ├─ 📸 AI Crop Diagnostic Hub (Live Camera & Upload)   │
│  ├─ 🌦️ Micro-Weather Advisory Widget                     │
│  ├─ 📊 Live Mandi Market Prices (Commodity Sparklines)  │
│  ├─ 📍 Verified Agro Kendra Store Finder                │
│  └─ 👥 Farmer Community Q&A Forum                      │
├────────────────────────────────────────────────────────┤
│ 📱 Bottom Navigation Dock (Home, Scan, Market, Forum)  │
└────────────────────────────────────────────────────────┘
```

---

## 6. UX Flows & User Journeys

### 6.1 Primary Diagnostic Journey
1. **Initiate Scan:** Tap `Start AI Scanner` or `Upload Photo` from Home Dashboard.
2. **Analysis:** Live AI Vision model processes crop leaf features with progress feedback.
3. **Diagnosis Presentation:**
   - Visual severity badge (Low / Moderate / High).
   - Audio explanation in selected language (English, Hindi, Kannada).
   - Tabbed Treatment options (Organic Remedies vs Chemical Fungicides).
   - Instant map directions to nearest verified Agro Kendra holding required stock.

---

## 7. Interaction Design & Micro-Interactions
- **Button Feedback:** `whileHover={{ scale: 1.02, y: -2 }}`, `whileTap={{ scale: 0.97 }}` with subtle shimmer light rays.
- **Card Hover Elevation:** Soft shadow expansion from `shadow-sm` to `shadow-md` on cursor hover.
- **Scanning Animation:** Vertical glowing laser line moving across leaf preview target area.
- **Toast Notifications:** Sonner floating toasts for actions (Voice loading, Map directions, Task saves).

---

## 8. Responsiveness & Accessibility (WCAG 2.1 AA)
- **Viewport Adaptation:** Single column layout on mobile screens (`< 640px`), expanding to balanced two/three-column grid on desktop/tablet (`≥ 1024px`).
- **Touch Target Size:** Minimum `48px` x `48px` for all interactive elements.
- **Contrast Ratios:** Text-to-background contrast ≥ `4.5:1` for normal body text and `3:1` for large bold headings.
- **Language Localization:** Instant toggle between English, Hindi (हिन्दी), and Kannada (ಕನ್ನಡ).

---

## 9. Upgrade Roadmap

### 🔴 Phase 1: High Priority (Immediate Execution)
- Maintain instant 1-tap AI scanner UX with responsive video viewfinder.
- Polish visual design of primary CTA buttons with glassmorphism shimmers and elevation micro-interactions.
- Implement accessible high-contrast text rendering on all device viewports.

### 🟡 Phase 2: Medium Priority
- Integrate real-time mandi price historical trend sparklines.
- Expand offline caching for diagnostic history and common treatment guides.
- Implement localized push notifications for daily weather spray alerts.

### 🟢 Phase 3: Low Priority (Future Polish)
- Community badge gamification for helpful farmer answers.
- Voice-first natural conversation bot for hands-free tractor/field usage.

---

## 10. Technical Implementation Notes
- **Framework:** React 18, Vite, TypeScript.
- **Styling Engine:** Tailwind CSS with modern arbitrary utility values and `@import "tailwindcss";`.
- **Animations:** Motion (`motion/react`) for layout and route transitions.
- **Icons:** `lucide-react` line icons.
- **Backend Services:** Express server proxy with Google Gemini 2.5/3 API integration.
