# 2. Core Features — Detailed Specifications

## a. Scheduled Virtual Visits

### User Flow
```
Family Member                   System                      ICU Nurse
     │                            │                            │
     ├── Browse available slots ──►│                            │
     │◄── Return slot calendar ────│                            │
     ├── Select slot & submit ────►│                            │
     │                            ├── Notify nurse ────────────►│
     │                            │◄── Approve/Decline ─────────│
     │◄── Confirmation + link ─────│                            │
     │◄── Reminder (1hr before) ───│                            │
     │◄── Reminder (15min before) ─│                            │
```

### Slot Configuration
- **Default duration**: 15 minutes (configurable: 10–30 min)
- **Daily limit**: 3 visits per patient per day (configurable)
- **Blackout windows**: Auto-block during rounds (6–8 AM), procedures, emergencies
- **Buffer time**: 5-minute gap between consecutive visits for sanitization
- **Advance booking**: Up to 7 days ahead; minimum 2 hours notice

### Approval Workflow
1. Family submits visit request with preferred slot
2. System checks conflicts (procedures, other visits, blackouts)
3. Assigned nurse receives push notification + dashboard alert
4. Nurse approves, declines (with reason), or suggests alternative
5. Family receives SMS/email/push with decision
6. Auto-approve mode available for pre-approved family members

---

## b. Live Video Session

### Technical Specifications
| Parameter | Value |
|-----------|-------|
| **Video Provider** | Daily.co (HIPAA configuration) |
| **Max Resolution** | 720p (adaptive to 240p) |
| **Audio Codec** | Opus (16–128 kbps adaptive) |
| **Video Codec** | VP8/H.264 (AV1 future) |
| **Target Latency** | < 200ms |
| **Min Bandwidth** | 500 kbps (audio-only fallback at 150 kbps) |
| **Encryption** | DTLS-SRTP (media) + WSS (signaling) |
| **Recording** | Disabled by default (HIPAA) |
| **Max Participants** | 4 family + 1 bedside + 1 nurse observer |

### Nurse Controls
- **Mute patient audio/video**: Protect privacy during bedside procedures
- **End session immediately**: Emergency override
- **Extend session**: Add 5 or 10 minutes if patient benefits
- **Join as observer**: Listen in without being visible (with consent indicator)
- **Share screen**: Show family non-sensitive info (general care plan updates)

### Session Lifecycle
```
1. Token Generated (5 min before) → 2. Waiting Room
3. Nurse Admits Family → 4. Active Session
5. 2-min Warning → 6. Session Ends
7. Post-Visit Mood Check-in Prompt
```

---

## c. Emotional Wellbeing Tracker

### Post-Visit Mood Check-In
Presented to both parties after each visit:

**Patient (if conscious)** — Simplified touch interface on bedside tablet:
- 😊 Happy | 😐 Neutral | 😢 Sad | 😰 Anxious | 😴 Tired
- Optional: "Would you like to visit again today?" (Yes/No)

**Family Member** — In-app survey:
- "How are you feeling after this visit?" (1–5 emoji scale)
- "Did the visit help you feel connected?" (Yes/Somewhat/No)
- "Any concerns to share with the care team?" (free text, optional)

### Data Utilization
- Aggregated mood trends displayed on Care Team Dashboard
- Alerts triggered if patient reports "Anxious" or "Sad" 3+ times
- Weekly wellbeing summary report for attending physician
- De-identified data feeds research analytics (with consent)

---

## d. Async Comfort Messages

### Message Types
| Type | Max Length | Format |
|------|-----------|--------|
| Video message | 60 seconds | MP4/WebM |
| Voice note | 120 seconds | OGG/MP3 |
| Photo + caption | 1 photo + 200 chars | JPEG/PNG |
| Text message | 500 characters | Plain text |

### Delivery Workflow
1. Family records/uploads message via app
2. Message encrypted and stored in S3 (AES-256)
3. Nurse receives notification of pending message
4. Nurse reviews message (content moderation)
5. Nurse approves and schedules playback time
6. Message plays on bedside tablet at scheduled interval
7. Playback confirmation logged

### Content Moderation
- Nurse reviews all messages before delivery
- Auto-flag: Messages over length limit, unusual file types
- Reject with reason: "Content may distress the patient"

---

## e. Care Team Transparency Panel

### Status Categories (Non-Sensitive)
```json
{
  "statuses": [
    {"code": "RESTING", "display": "Resting comfortably", "icon": "😴"},
    {"code": "IN_PROCEDURE", "display": "In procedure — visit may be rescheduled", "icon": "🏥"},
    {"code": "IMPROVING", "display": "Showing signs of improvement", "icon": "📈"},
    {"code": "STABLE", "display": "Condition stable", "icon": "✅"},
    {"code": "VISIT_READY", "display": "Ready for visitors", "icon": "👋"},
    {"code": "SLEEPING", "display": "Currently sleeping", "icon": "💤"},
    {"code": "UNDER_OBSERVATION", "display": "Under close observation", "icon": "👁️"}
  ]
}
```

### Key Design Principles
- **No PHI exposed**: Statuses are general, never mention diagnoses, medications, or vitals
- **Nurse-controlled**: Only assigned nurse/doctor can update status
- **Timestamped**: Family sees when status was last updated
- **Push notifications**: Family opted-in to receive status change alerts

---

## f. Multilingual Support

### Supported Languages (Phase 1)
| Language | Code | Translation Service |
|----------|------|-------------------|
| English | `en` | Default |
| Hindi | `hi` | Google Cloud Translation API |
| Tamil | `ta` | Google Cloud Translation API |
| Telugu | `te` | Google Cloud Translation API |
| Kannada | `kn` | Google Cloud Translation API |
| Bengali | `bn` | Google Cloud Translation API |

### Implementation
- **UI Strings**: i18next framework with JSON language packs
- **Real-time captions**: Google Cloud Speech-to-Text → Translation API → WebSocket to client
- **Async messages**: Auto-translate text messages; audio/video messages show translated transcript
- **Status updates**: Pre-translated status templates stored in DB per language

---

## g. Bandwidth Adaptive Streaming

### Quality Tiers
| Tier | Resolution | Bitrate | Trigger |
|------|-----------|---------|---------|
| **High** | 720p @ 30fps | 1.5 Mbps | Bandwidth > 2 Mbps |
| **Medium** | 480p @ 24fps | 800 kbps | Bandwidth 1–2 Mbps |
| **Low** | 360p @ 15fps | 400 kbps | Bandwidth 500 kbps–1 Mbps |
| **Minimal** | 240p @ 15fps | 200 kbps | Bandwidth 200–500 kbps |
| **Audio-only** | None | 64 kbps | Bandwidth < 200 kbps |

### Adaptive Logic
- Bandwidth sampled via `RTCPeerConnection.getStats()` every 3 seconds
- 10% hysteresis buffer to prevent oscillation
- Audio quality **never** degraded below Opus 32 kbps
- Visual indicator shown: 🟢 Excellent | 🟡 Good | 🟠 Fair | 🔴 Audio Only
- Graceful fallback: Frozen video → avatar placeholder → audio-only mode

---

## h. Emergency Family Alert

### Trigger Conditions
1. **Manual trigger**: ICU nurse/doctor presses emergency alert button on dashboard
2. **Automated trigger** (Phase 2): Integration with patient monitoring systems — rapid vital changes

### Alert Flow
```
Trigger Event
    │
    ├── SMS to all registered next-of-kin (immediate)
    ├── Push notification (immediate)
    ├── Email with "Join Now" link (immediate)
    ├── Auto-create emergency video room (no scheduling needed)
    │
    └── Escalation (if no response in 5 min)
        ├── Second SMS + phone call via Twilio Voice
        └── Notify hospital social worker
```

### Emergency Session Rules
- No time limit (nurse controls duration)
- Up to 6 family members can join simultaneously
- Session priority: All other video sessions on the unit downgraded in bandwidth
- Audio-only mode available for poor connectivity
- All emergency sessions logged separately for audit
