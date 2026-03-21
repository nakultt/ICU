# 5. API Design — REST Endpoints

## Base URL
```
Production:  https://api.visicare.health/v1
Staging:     https://api-staging.visicare.health/v1
```

## Authentication
All endpoints require `Authorization: Bearer <JWT>` header unless marked `[PUBLIC]`.
Tokens are issued by Auth0 with RS256 signing. Access tokens expire in 15 minutes.

## Role Abbreviations
- **F** = Family Member
- **N** = Nurse
- **A** = ICU Admin
- **H** = Hospital Admin
- **S** = System (internal service-to-service)

---

## Visit Scheduling

### `POST /visits` — Request a visit
**Roles**: F
```json
// Request
{
  "patient_id": "uuid",
  "scheduled_start": "2025-03-20T14:00:00+05:30",
  "scheduled_end": "2025-03-20T14:15:00+05:30",
  "note": "Would like to read to my father"
}

// Response 201
{
  "id": "uuid",
  "status": "pending",
  "patient_id": "uuid",
  "family_member_id": "uuid",
  "scheduled_start": "2025-03-20T14:00:00+05:30",
  "scheduled_end": "2025-03-20T14:15:00+05:30",
  "created_at": "2025-03-19T10:00:00Z"
}
```

### `GET /visits` — List visits
**Roles**: F, N, A
```
Query params: ?patient_id=uuid&status=approved&date=2025-03-20&page=1&limit=20
```
```json
// Response 200
{
  "items": [
    {
      "id": "uuid",
      "patient": {"id": "uuid", "name": "John D.", "bed": "ICU-12"},
      "family_member": {"id": "uuid", "name": "Jane D.", "relationship": "spouse"},
      "scheduled_start": "2025-03-20T14:00:00+05:30",
      "scheduled_end": "2025-03-20T14:15:00+05:30",
      "status": "approved",
      "approved_by": {"id": "uuid", "name": "Nurse Priya"}
    }
  ],
  "total": 15,
  "page": 1,
  "pages": 1
}
```

### `PATCH /visits/{id}/approve` — Approve visit
**Roles**: N, A
```json
// Response 200
{"id": "uuid", "status": "approved", "approved_by": "uuid"}
```

### `PATCH /visits/{id}/decline` — Decline visit
**Roles**: N, A
```json
// Request
{"reason": "Patient undergoing procedure at that time"}

// Response 200
{"id": "uuid", "status": "declined", "decline_reason": "Patient undergoing procedure at that time"}
```

### `DELETE /visits/{id}` — Cancel visit
**Roles**: F, N, A
```json
// Request
{"reason": "Family conflict"}

// Response 200
{"id": "uuid", "status": "cancelled"}
```

### `GET /visits/slots` — Available time slots
**Roles**: F
```
Query params: ?patient_id=uuid&date=2025-03-20
```
```json
// Response 200
{
  "date": "2025-03-20",
  "slots": [
    {"start": "08:00", "end": "08:15", "available": true},
    {"start": "08:15", "end": "08:30", "available": false, "reason": "booked"},
    {"start": "10:00", "end": "10:15", "available": true}
  ]
}
```

---

## Video Session

### `POST /sessions/token` — Generate session token
**Roles**: F, N
```json
// Request
{"schedule_id": "uuid"}

// Response 200
{
  "room_url": "https://visicare.daily.co/room-abc123",
  "token": "eyJ...",  // Daily.co meeting token (15-min expiry)
  "expires_at": "2025-03-20T14:20:00Z",
  "session_id": "uuid"
}
```

### `POST /sessions/{id}/start` — Mark session started
**Roles**: S (webhook from Daily.co)
```json
// Response 200
{"session_id": "uuid", "status": "active", "started_at": "2025-03-20T14:00:00Z"}
```

### `POST /sessions/{id}/end` — End session
**Roles**: N, S
```json
// Request
{"ended_by": "nurse", "reason": "scheduled_end"}

// Response 200
{"session_id": "uuid", "status": "ended", "duration_seconds": 900}
```

### `POST /sessions/{id}/mute` — Mute participant
**Roles**: N
```json
// Request
{"participant": "family", "mute_audio": true, "mute_video": false}

// Response 200
{"status": "muted", "participant": "family"}
```

---

## Mood Check-In

### `POST /mood` — Submit mood check-in
**Roles**: F (for family), N (on behalf of patient)
```json
// Request
{
  "session_id": "uuid",
  "respondent_type": "family",
  "mood_score": 4,
  "mood_emoji": "😊",
  "felt_connected": "yes",
  "free_text": "It was wonderful to see him smile"
}

// Response 201
{"id": "uuid", "submitted_at": "2025-03-20T14:16:00Z"}
```

### `GET /mood/trends` — Mood trend data
**Roles**: N, A
```
Query params: ?patient_id=uuid&days=7
```
```json
// Response 200
{
  "patient_id": "uuid",
  "period": "7_days",
  "data": [
    {"date": "2025-03-14", "avg_patient_score": 3.5, "avg_family_score": 4.0, "sessions": 2},
    {"date": "2025-03-15", "avg_patient_score": 4.0, "avg_family_score": 4.5, "sessions": 3}
  ],
  "alerts": [
    {"date": "2025-03-13", "type": "low_mood", "details": "Patient reported anxious 3 consecutive visits"}
  ]
}
```

---

## Async Messages

### `POST /messages` — Upload async message
**Roles**: F
```
Content-Type: multipart/form-data
Fields: patient_id, message_type, content_text (optional), media_file
```
```json
// Response 201
{
  "id": "uuid",
  "status": "pending_review",
  "message_type": "video",
  "media_duration_sec": 45,
  "expires_at": "2025-03-27T10:00:00Z"
}
```

### `PATCH /messages/{id}/review` — Approve/reject message
**Roles**: N
```json
// Request
{"decision": "approved", "scheduled_play_at": "2025-03-20T16:00:00+05:30"}

// Response 200
{"id": "uuid", "status": "approved", "scheduled_play_at": "2025-03-20T16:00:00+05:30"}
```

### `GET /messages` — List messages for patient
**Roles**: N, A
```
Query params: ?patient_id=uuid&status=pending_review
```

---

## Patient Status Updates

### `POST /patients/{id}/status` — Update patient status
**Roles**: N
```json
// Request
{"status_code": "RESTING", "display_text": "Resting comfortably", "note": "Post-procedure recovery"}

// Response 200
{"patient_id": "uuid", "status_code": "RESTING", "updated_at": "2025-03-20T15:00:00Z"}
```

### `GET /patients/{id}/status` — Get current status (family-facing)
**Roles**: F
```json
// Response 200
{
  "patient_id": "uuid",
  "patient_name": "John D.",
  "status": "Resting comfortably",
  "icon": "😴",
  "updated_at": "2025-03-20T15:00:00Z",
  "updated_by": "Care Team"
}
```

---

## Emergency Alert

### `POST /alerts/emergency` — Trigger emergency alert
**Roles**: N, A
```json
// Request
{
  "patient_id": "uuid",
  "severity": "critical",
  "message": "Patient condition has changed. Immediate family visit available."
}

// Response 201
{
  "alert_id": "uuid",
  "room_url": "https://visicare.daily.co/emergency-xyz789",
  "notified_contacts": [
    {"name": "Jane D.", "channels": ["sms", "push"], "status": "sent"}
  ],
  "session_id": "uuid"
}
```

---

## Error Response Format
```json
{
  "error": {
    "code": "VISIT_CONFLICT",
    "message": "Another visit is already scheduled for this time slot",
    "details": {"conflicting_visit_id": "uuid"}
  }
}
```

## HTTP Status Codes Used
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (double booking) |
| 429 | Rate limited |
| 500 | Internal server error |
