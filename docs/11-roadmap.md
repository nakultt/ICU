# 11. Implementation Roadmap

## Timeline Overview

```
Month:  1    2    3    4    5    6    7    8    9    10   11   12
        ├────────┤
         MVP (Wk 1–4)
              ├─────────────────┤
               V1 (Month 2–3)
                                ├──────────────────────┤
                                 V2 (Month 4–6)
                                                        ├──────────────────────┤
                                                         V3 (Month 7–12)
```

---

## MVP — Weeks 1–4: Core Video Visit + Scheduling

### Scope
Minimum viable product proving the core value proposition: **a family member can book, get approved, and join a video call with their loved one in the ICU**.

### Deliverables

| Week | Milestone | Details |
|------|-----------|---------|
| **Week 1** | Project setup + Auth | FastAPI scaffolding, PostgreSQL schema (core 6 tables), Auth0 integration, CI/CD pipeline, Daily.co account with HIPAA add-on |
| **Week 2** | Scheduling engine | Visit request API, slot availability check, nurse approval/decline flow, basic notification (email only) |
| **Week 3** | Video sessions | Daily.co room creation, token generation, family-side PWA video screen, bedside tablet kiosk mode, nurse mute/end controls |
| **Week 4** | Integration + Testing | End-to-end flow testing, HIPAA security review, basic nurse dashboard, deployment to AWS staging |

### MVP Tech Stack
- Backend: FastAPI + PostgreSQL (RDS) + Redis
- Frontend: React + TypeScript + daily-react SDK
- Auth: Auth0 (2 roles: family, nurse)
- Video: Daily.co HIPAA
- Deploy: Docker on ECS (upgrade to EKS in V2)
- Notifications: SendGrid email only

### MVP Success Criteria
- [ ] Family can register and link to patient
- [ ] Family can view available slots and request a visit
- [ ] Nurse can approve/decline visit from dashboard
- [ ] Family receives email confirmation
- [ ] Video call works at 480p+ with < 300ms latency
- [ ] Nurse can mute and end sessions
- [ ] All sessions logged in audit trail
- [ ] HTTPS everywhere, AES-256 at rest

---

## V1 — Months 2–3: Async Messages + Mood Tracker + Multilingual

### New Features
| Feature | Priority | Effort |
|---------|----------|--------|
| Async comfort messages (video/voice/text) | P0 | 2 weeks |
| Post-visit mood check-in | P0 | 1 week |
| SMS notifications (Twilio) | P0 | 1 week |
| Push notifications (Firebase) | P1 | 1 week |
| Multilingual UI (Hindi + English) | P1 | 1 week |
| Care team status panel | P1 | 1 week |
| Family app polish + PWA install prompt | P2 | 1 week |

### Infra Upgrades
- S3 for async media storage with lifecycle policies
- Celery + Redis for background media processing
- SQS/SNS for event-driven notifications

---

## V2 — Months 4–6: Analytics + EHR Integration + Emergency Alerts

### New Features
| Feature | Priority | Effort |
|---------|----------|--------|
| Hospital admin analytics dashboard | P0 | 3 weeks |
| Emergency family alert system | P0 | 2 weeks |
| Extended multilingual (Tamil, Telugu, Kannada, Bengali) | P1 | 2 weeks |
| Real-time captions via Speech-to-Text | P1 | 2 weeks |
| HL7 FHIR R4 integration (patient data sync) | P1 | 3 weeks |
| Bandwidth quality indicator on video screen | P2 | 1 week |
| Mood trend analytics for care team | P2 | 1 week |

### Infra Upgrades
- Migrate from ECS to EKS (Kubernetes)
- Terraform IaC for all infrastructure
- Grafana + CloudWatch dashboards
- Staging environment with synthetic data

---

## V3 — Months 7–12: AI + Advanced Features

### New Features
| Feature | Priority | Effort |
|---------|----------|--------|
| AI-powered wellbeing scoring (NLP on mood free-text + patterns) | P1 | 4 weeks |
| Voice-to-report summaries for care teams | P1 | 3 weeks |
| Auto-translate real-time captions (multi-language) | P1 | 2 weeks |
| Patient vitals correlation with visit data (research mode) | P2 | 3 weeks |
| White-label customization engine | P2 | 3 weeks |
| On-premise deployment option (Helm charts) | P2 | 4 weeks |
| Mobile native app (React Native) if PWA gaps identified | P3 | 6 weeks |

### AI/ML Roadmap
```
Month 7–8:  Fine-tune sentiment model on mood logs
Month 9:    Train wellbeing scoring model (mood + visit frequency + status changes)
Month 10:   Pilot voice-to-report (Whisper ASR + GPT-4 summarization)
Month 11:   Deploy AI alerts ("Patient wellbeing declining — recommend intervention")
Month 12:   Research paper submission with anonymized data (with hospital IRB approval)
```

---

## Team Requirements by Phase

| Phase | Engineering | Design | Clinical | DevOps |
|-------|------------|--------|----------|--------|
| MVP | 2 full-stack | 1 UI/UX | 1 advisor | 0.5 |
| V1 | 3 full-stack | 1 UI/UX | 1 advisor | 0.5 |
| V2 | 4 full-stack + 1 mobile | 1 UI/UX | 1 clinical lead | 1 |
| V3 | 5 engineers + 1 ML | 1 UI/UX + 1 UX researcher | 1 clinical lead | 1 |
