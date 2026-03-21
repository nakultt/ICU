# 6. UI/UX Wireframe Descriptions

## Screen 1: Family Onboarding & Patient Linking

### 1a. Welcome / Registration Screen
```
┌─────────────────────────────────────────────┐
│           🏥 VisiCare                        │
│     Virtual ICU Visitation Platform          │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  "Stay connected with your loved one   │  │
│  │   in the ICU — safely and securely"    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [Sign Up with Phone Number]                 │
│  [Login with Email]                          │
│                                              │
│  ── or ──                                    │
│                                              │
│  Enter Hospital Access Code: [________]      │
│  (Provided by ICU nurse at admission)        │
│                                              │
│  🌐 Language: [English ▼]                    │
│     Hindi | Tamil | Telugu | Kannada | Bengali│
└─────────────────────────────────────────────┘
```

### 1b. Patient Linking Flow
```
┌─────────────────────────────────────────────┐
│  Link to Your Family Member                  │
│                                              │
│  Hospital: [Apollo Hospitals, Chennai ▼]     │
│  Patient Access Code: [_ _ _ _ _ _]          │
│  (6-digit code provided by ICU staff)        │
│                                              │
│  Your Relationship: [Spouse ▼]               │
│                                              │
│  [ ] I am the next-of-kin                    │
│                                              │
│  [Submit for Verification]                   │
│                                              │
│  ℹ️ ICU staff will verify your identity       │
│     within 2 hours. You'll receive an SMS    │
│     confirmation.                            │
└─────────────────────────────────────────────┘
```

---

## Screen 2: Visit Booking Calendar

```
┌─────────────────────────────────────────────┐
│  📅 Book a Visit with Rajesh K. (Bed ICU-7) │
│  Status: 😴 Resting comfortably              │
│                                              │
│  ◄ March 2025 ►                              │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun           │
│  17   18   19  [20]  21   22   23            │
│  24   25   26   27   28   29   30            │
│                                              │
│  Thursday, March 20 — Available Slots:       │
│  ┌──────────────────────────────────────┐    │
│  │ 🟢 08:30 – 08:45  [Book]            │    │
│  │ 🔴 10:00 – 10:15  (Booked)          │    │
│  │ 🟡 14:00 – 14:15  [Book]            │    │
│  │ 🔴 14:15 – 14:30  (Procedure)       │    │
│  │ 🟢 16:00 – 16:15  [Book]            │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ℹ️ Visits are 15 minutes. ICU nurse will    │
│     confirm your booking within 30 minutes.  │
│                                              │
│  [View My Upcoming Visits (2)]               │
└─────────────────────────────────────────────┘
```

---

## Screen 3: Live Visit Screen

```
┌─────────────────────────────────────────────┐
│  VisiCare — Live Visit                       │
│  Rajesh K. • Bed ICU-7 • 12:45 remaining    │
├─────────────────────────────────────────────┤
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │                                       │   │
│  │         PATIENT VIDEO FEED            │   │
│  │        (Large, centered view)         │   │
│  │                                       │   │
│  │                            ┌────────┐ │   │
│  │                            │ Self   │ │   │
│  │                            │ View   │ │   │
│  │                            │ (PiP)  │ │   │
│  │                            └────────┘ │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  🟢 Connection: Excellent (720p)             │
│                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────┐  │
│  │ 🎤  │ │ 📷  │ │ 💬  │ │ 👥  │ │ 🔴   │  │
│  │Mute │ │Video│ │Chat │ │Ppl  │ │Leave │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └──────┘  │
│                                              │
│  ⏱️ Session ends at 2:15 PM                  │
└─────────────────────────────────────────────┘
```

**Chat Panel (slide-in from right):**
```
┌──────────────────────┐
│ Visit Chat           │
│ (Text only, not      │
│  recorded)           │
│──────────────────────│
│ You: Hello Papa 💕   │
│ 2:01 PM              │
│                      │
│ [Type message... 📎] │
│ [Send]               │
└──────────────────────┘
```

---

## Screen 4: Nurse ICU Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  🏥 VisiCare Nurse Dashboard — Cardiac ICU                   │
│  Welcome, Nurse Priya | Unit CICU | 12 beds                 │
├─────────────┬───────────────────────────────────────────────┤
│  SIDEBAR    │  MAIN CONTENT                                  │
│             │                                                │
│ 📊 Overview │  ┌─── Active Visits Now (2) ────────────────┐ │
│ 📅 Schedule │  │ Bed 3: Rajesh K. ↔ Jane D. (8 min left)  │ │
│ 💬 Messages │  │   [👁️ Observe] [🔇 Mute] [⏹️ End]        │ │
│ 📈 Wellness │  │ Bed 7: Meera S. ↔ Arun S. (12 min left)  │ │
│ ⚙️ Settings │  │   [👁️ Observe] [🔇 Mute] [⏹️ End]        │ │
│             │  └──────────────────────────────────────────┘ │
│             │                                                │
│ ┌────────┐  │  ┌─── Pending Approvals (3) ────────────────┐ │
│ │ 🚨     │  │  │ Bed 3: Request from Anil K. (son)        │ │
│ │ALERT   │  │  │   Mar 20, 2:00 PM  [✅ Approve] [❌ Deny] │ │
│ │BUTTON  │  │  │ Bed 9: Request from Lakshmi R. (wife)    │ │
│ │(Red)   │  │  │   Mar 20, 4:00 PM  [✅ Approve] [❌ Deny] │ │
│ └────────┘  │  └──────────────────────────────────────────┘ │
│             │                                                │
│             │  ┌─── Upcoming Today (5) ───────────────────┐ │
│             │  │ 2:00 PM  Bed 3 — Anil K.    (pending)    │ │
│             │  │ 2:30 PM  Bed 5 — Fatima B.  (approved)   │ │
│             │  │ 4:00 PM  Bed 9 — Lakshmi R. (pending)    │ │
│             │  └──────────────────────────────────────────┘ │
│             │                                                │
│             │  ┌─── Patient Status Quick Update ──────────┐ │
│             │  │ Bed: [3 ▼]  Status: [Resting ▼] [Update] │ │
│             │  └──────────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────────┘
```

---

## Screen 5: Hospital Admin Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  📊 VisiCare Analytics — Apollo Hospitals Chennai            │
│  Period: March 2025  |  Units: All ICUs (4)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  1,247   │ │  94.2%   │ │  4.3/5   │ │   12     │       │
│  │  Total   │ │  Visit   │ │  Family  │ │ Emergency│       │
│  │  Visits  │ │ Complete │ │ Satisfcn │ │  Alerts  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌── Visit Volume (30 days) ──────────────────────────────┐ │
│  │  50┤ ▓▓                                                │ │
│  │  40┤ ▓▓ ▓▓    ▓▓                                      │ │
│  │  30┤ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓    ▓▓                        │ │
│  │  20┤ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓                    │ │
│  │    └──────────────────────────────────────────────────│ │
│  │     Mar 1                    Mar 15            Mar 30  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌── Mood Trends ──────────┐ ┌── By Unit ──────────────┐   │
│  │ Patient Avg: 3.8 → 4.1  │ │ MICU:   342 visits     │   │
│  │ Family Avg:  4.0 → 4.4  │ │ SICU:   298 visits     │   │
│  │ 📈 Improvement: +7.9%   │ │ CICU:   387 visits     │   │
│  │ ⚠️ 3 low-mood alerts     │ │ NICU:   220 visits     │   │
│  └──────────────────────────┘ └────────────────────────┘   │
│                                                              │
│  ┌── Compliance & Audit ──────────────────────────────────┐ │
│  │ Total Audit Events: 45,892  |  PHI Access: 1,234      │ │
│  │ Failed Logins: 23           |  Consent Changes: 89    │ │
│  │ [Download Audit Report (CSV)]  [View Full Audit Log]  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles
- **Accessibility**: WCAG 2.1 AA compliant, high contrast, keyboard navigable
- **Responsive**: Family app works on 320px mobile to 1920px desktop
- **Nurse dashboard**: Optimized for 1024px+ tablets mounted at nurse stations
- **Dark mode**: Optional for nurse dashboard (reduces eye strain during night shifts)
- **Loading states**: Skeleton screens, never blank white screens
- **Error states**: Friendly illustrations with clear retry actions
