# 12. Pitch Deck Outline — 10 Slides

---

## Slide 1: THE PROBLEM
**Title**: "ICU Isolation Kills — Not Just the Spirit, But the Body"

**Talking Points**:
- 5 million+ patients admitted to ICUs in India annually
- Strict infection control protocols limit family visits to near-zero in many ICUs
- 30–80% of isolated ICU patients develop delirium (Signa Vitae, 2023)
- ICU isolation linked to prolonged recovery, elevated cortisol, PTSD in 40% of survivors
- COVID-19 proved the human cost: families couldn't say goodbye

**Visual**: Split image — isolated patient behind glass vs. a family waiting outside ICU doors

---

## Slide 2: MARKET SIZE
**Title**: "$1.6 Billion Opportunity in Virtual ICU Care"

**Talking Points**:
- India: 300,000+ ICU beds across 15,000 hospitals
- Global telehealth market: $123B (2024) → $455B (2030), 24.7% CAGR
- SAM (private hospitals, 20+ beds): $540M in India alone
- Post-COVID: hospitals actively seeking structured visitation solutions
- Government push: Ayushman Bharat Digital Mission driving healthtech adoption

**Visual**: TAM/SAM/SOM concentric circles with market sizing

---

## Slide 3: OUR SOLUTION — VISICARE
**Title**: "VisiCare: Secure Virtual ICU Visits That Heal"

**Talking Points**:
- Scheduled, nurse-approved video visits between families and ICU patients
- HIPAA-compliant, DPDP Act 2023 compliant
- Works on any device — no app download required (PWA)
- Built for Indian hospitals: 6 Indian languages, low-bandwidth optimized
- Nurse-controlled: mute, end, observe — full clinical oversight

**Visual**: Product demo — 30-second video/GIF of the booking → approval → video call flow

---

## Slide 4: PRODUCT DEMO
**Title**: "See VisiCare in Action"

**Talking Points** (live demo or recorded walkthrough):
1. Family opens link → selects language → books 2 PM visit
2. Nurse receives notification → approves on dashboard
3. Family gets SMS confirmation + reminder
4. Video call starts — clear, low-latency, nurse observing
5. Post-visit: mood check-in submitted
6. Nurse views wellbeing trend on dashboard

**Visual**: Screen recordings of actual product (or high-fidelity prototype)

---

## Slide 5: TECH ARCHITECTURE
**Title**: "Built for Healthcare, Not Adapted from Consumer Tech"

**Talking Points**:
- React PWA + FastAPI + PostgreSQL + Daily.co (HIPAA)
- AES-256 at rest, TLS 1.3 in transit, DTLS-SRTP for video
- Adaptive bitrate: 720p → audio-only based on bandwidth
- Deployed on AWS Mumbai with HIPAA BAA
- Audit logging for 7-year compliance retention
- EHR-integration ready via HL7 FHIR R4

**Visual**: Simplified architecture diagram (3 layers: Frontend → Backend → Data + Video)

---

## Slide 6: CLINICAL EVIDENCE
**Title**: "Evidence Shows: Family Connection Saves Lives and Money"

**Talking Points**:
- Virtual visits reduce patient anxiety by 34% (BMJ Open, 2022)
- Regular family contact lowers cortisol by 23% (JAMA, 2021)
- ABCDEF bundle (SCCM) mandates family engagement for delirium prevention
- Projected: 1.0–1.5 day reduction in average ICU stay per patient
- For a 100-bed hospital: ₹13.5–20.3 crore annual savings

**Visual**: Before/after comparison chart — ICU stay days with/without VisiCare

---

## Slide 7: COMPLIANCE & TRUST
**Title**: "Triple-Compliant: HIPAA + GDPR + DPDP Act 2023"

**Talking Points**:
- HIPAA: BAA with Daily.co + AWS + Twilio; E2E encryption; no recording by default
- India DPDP Act 2023: Explicit consent, 72hr breach notification, data localization in Mumbai
- GDPR-ready for international expansion
- Immutable audit logs; role-based access control
- SOC 2 Type II certification planned Year 2

**Visual**: Compliance badges/shields with checkmarks

---

## Slide 8: BUSINESS MODEL
**Title**: "B2B SaaS: Accessible Pricing, Massive ROI"

**Talking Points**:
- Three tiers: Starter (₹25K/mo), Standard (₹75K/mo), Enterprise (custom)
- 128x ROI for a 100-bed hospital (₹10.5L cost vs ₹13.5Cr savings)
- Revenue model: Monthly subscription + usage-based overage
- Land-and-expand: Start with 1 ICU → scale to all units
- Year 1 target: 20 hospitals → ARR ₹1.8 crore

**Visual**: Pricing table + ROI calculator screenshot

---

## Slide 9: TRACTION PLAN & TEAM
**Title**: "Execution Plan: Pilots → Scale → AI"

**Talking Points**:
- Month 1–4: MVP with 3 pilot hospitals (Chennai/Bangalore)
- Month 5–6: Case study publication + regional sales launch
- Month 7–12: 50+ hospitals, AI wellbeing features, EHR integration
- Year 2: National expansion, 300 hospitals, ₹27Cr ARR

**Team Slide** (placeholder):
- CEO/Product: [Name] — Healthcare tech background
- CTO: [Name] — Full-stack, video/WebRTC expertise
- Clinical Advisor: [Name] — ICU physician, research publications
- BD Lead: [Name] — Hospital sales experience

**Visual**: Roadmap timeline + team headshots

---

## Slide 10: THE ASK
**Title**: "Join Us in Humanizing the ICU"

**Talking Points**:
- **Hackathon Ask**: Award recognition + mentorship connections to hospital networks
- **Seed Round Ask** (if applicable): ₹2 crore ($240K) for 18-month runway
  - Use of funds: Engineering team (60%), pilot hospital partnerships (20%), clinical validation study (10%), compliance certifications (10%)
- **Partnership Ask**: Hospital pilot partners for 90-day free deployment
- **Vision**: Every ICU patient stays connected to their family. Every family has peace of mind. Every nurse has the tools to make it happen.

**Visual**: Emotional closing image — family smiling during a VisiCare video call. Tagline: *"Because healing happens together."*

---

## Pitch Deck Design Notes
- **Duration**: 10 minutes presentation + 5 minutes Q&A
- **Design**: Dark theme, blue/teal healthcare palette, large typography
- **Key metrics on every slide**: Use data-driven callouts
- **Demo video**: 90-second embedded product walkthrough (Slide 4)
- **Emotional hook**: Open with patient/family story (Slide 1), close with vision (Slide 10)
