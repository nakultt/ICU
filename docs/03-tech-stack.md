# 3. Tech Stack Recommendation & Justification

## Full Stack Overview

```
┌────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│  React 18 + TypeScript + TailwindCSS                   │
│  PWA (Workbox) — No app store dependency               │
│  i18next (6 languages) + Daily.co React SDK            │
├────────────────────────────────────────────────────────┤
│                    BACKEND                              │
│  FastAPI (Python 3.11+) — Async endpoints              │
│  Celery + Redis — Background task queue                │
│  SQLAlchemy + Alembic — ORM + Migrations               │
├────────────────────────────────────────────────────────┤
│                 REAL-TIME VIDEO                         │
│  Daily.co Video API — HIPAA BAA ($500/mo)              │
│  WebRTC (DTLS-SRTP) — E2E encrypted media             │
│  Adaptive bitrate — 720p → audio-only fallback         │
├────────────────────────────────────────────────────────┤
│                   DATABASE                              │
│  PostgreSQL 15 (RDS) — AES-256 at rest                 │
│  Redis 7 (ElastiCache) — Sessions + cache              │
│  S3 — Async media (encrypted, lifecycle policies)      │
├────────────────────────────────────────────────────────┤
│                 NOTIFICATIONS                           │
│  Twilio SMS API — Visit reminders + emergency alerts   │
│  SendGrid — Email confirmations + reports              │
│  Firebase Cloud Messaging — Push notifications         │
├────────────────────────────────────────────────────────┤
│              AUTH & AUTHORIZATION                       │
│  Auth0 — SSO, MFA, RBAC                               │
│  Roles: patient_family, nurse, icu_admin, hosp_admin   │
│  JWT (RS256, 15-min access + 7-day refresh)            │
├────────────────────────────────────────────────────────┤
│              INFRASTRUCTURE                             │
│  AWS (Mumbai ap-south-1) — HIPAA BAA signed            │
│  Docker + Amazon EKS — Container orchestration         │
│  Terraform — Infrastructure as Code                    │
│  GitHub Actions — CI/CD pipeline                       │
└────────────────────────────────────────────────────────┘
```

## Video API Comparison & Decision

| Criterion | Daily.co ✅ | Twilio Video | Agora |
|-----------|-----------|--------------|-------|
| **HIPAA BAA** | ✅ Included with Healthcare add-on | ✅ Enterprise Edition required | ✅ Available |
| **BAA Cost** | $500/month flat | Enterprise pricing ($$$$) | Custom pricing |
| **Per-minute Cost** | $0.004/participant-min | $0.004/participant-min | $0.00399–$0.01999/min (varies by resolution) |
| **Free Tier** | 10,000 min/month | Trial credits only | 10,000 min/month |
| **React SDK** | ✅ Excellent (daily-react) | ✅ Good | ⚠️ Decent |
| **Adaptive Bitrate** | ✅ Built-in SFU | ✅ Built-in | ✅ Built-in |
| **Max Participants** | 200 | 50 | 128 |
| **Server-side Controls** | ✅ REST API for room mgmt | ✅ REST API | ✅ REST API |
| **Nurse Controls (mute/kick)** | ✅ Native owner controls | ✅ Via API | ✅ Via API |
| **Documentation Quality** | ✅ Excellent, healthcare-focused | ✅ Good | ⚠️ Adequate |
| **Latency (India)** | < 200ms (Singapore PoP) | < 200ms | < 150ms |

### Decision: **Daily.co**

**Rationale:**
1. **Explicit HIPAA healthcare add-on** with clear pricing ($500/mo) vs. opaque enterprise negotiations
2. **Best-in-class React SDK** (`daily-react`) with pre-built components reducing development time by ~60%
3. **Built-in nurse controls**: Room owner can mute/eject participants natively
4. **Healthcare-focused documentation** with HIPAA integration guides
5. **Competitive pricing** at scale — $0.004/min matches Twilio without enterprise lock-in
6. **10,000 free minutes/month** — sufficient for MVP testing

### Cost Estimate (100-bed ICU hospital)
```
Assumptions:
- 100 beds, 60% occupancy = 60 active patients
- 3 visits/day × 15 min × 2 participants = 5,400 participant-min/day
- Monthly: 5,400 × 30 = 162,000 participant-min

Daily.co Cost:
- HIPAA add-on: $500/month
- Video minutes: 162,000 × $0.004 = $648/month
- Total: ~$1,148/month (₹96,000/month)
```

## Frontend Stack Detail

| Technology | Purpose | Why |
|-----------|---------|-----|
| React 18 | UI framework | Component model, hooks, concurrent rendering |
| TypeScript | Type safety | Reduces bugs in healthcare-critical code |
| TailwindCSS | Styling | Rapid UI development, consistent design system |
| Vite | Build tool | Fast HMR, optimized production builds |
| daily-react | Video SDK | Daily.co's official React hooks library |
| i18next | Internationalization | 6 Indian languages + English |
| Workbox | PWA / Service Worker | Offline support, installable on mobile |
| React Query | Server state | Caching, background refetching |
| React Hook Form | Forms | Performant form validation |
| Zustand | Client state | Lightweight global state management |

## Backend Stack Detail

| Technology | Purpose | Why |
|-----------|---------|-----|
| FastAPI | Web framework | Async-first, auto-OpenAPI docs, type hints |
| Python 3.11+ | Language | Rich ecosystem, ML/AI ready for Phase 2 |
| SQLAlchemy 2.0 | ORM | Async support, mature PostgreSQL support |
| Alembic | Migrations | Reliable schema versioning |
| Celery | Task queue | Async media processing, scheduled notifications |
| Pydantic v2 | Validation | Request/response validation, settings management |
| python-jose | JWT handling | RS256 token verification |
| boto3 | AWS SDK | S3, SQS, SNS, SES integration |
| httpx | HTTP client | Async HTTP calls to Daily.co API |
