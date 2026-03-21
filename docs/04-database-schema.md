# 4. Database Schema

## Entity-Relationship Overview

```
hospitals ─┬── hospital_units ─── patients ─┬── visit_schedules ─── visit_sessions
            │                                ├── mood_logs
            │                                ├── async_messages
            │                                └── patient_statuses
            │
            └── staff_members
                                  family_members ─┬── visit_schedules
                                                   ├── mood_logs
                                                   └── async_messages

                                  notifications (polymorphic)
                                  audit_logs (append-only)
```

## Complete SQL Schema

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. HOSPITALS
-- ============================================================
CREATE TABLE hospitals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE NOT NULL,          -- e.g., "AIIMS-DEL"
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    country         VARCHAR(100) DEFAULT 'India',
    phone           VARCHAR(20),
    email           VARCHAR(255),
    license_tier    VARCHAR(20) DEFAULT 'standard',       -- 'basic', 'standard', 'enterprise'
    max_beds        INTEGER DEFAULT 50,
    timezone        VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. HOSPITAL UNITS (ICU wards)
-- ============================================================
CREATE TABLE hospital_units (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,                -- e.g., "Cardiac ICU", "MICU"
    code            VARCHAR(50) NOT NULL,
    floor           VARCHAR(20),
    total_beds      INTEGER NOT NULL DEFAULT 10,
    visit_duration  INTEGER DEFAULT 15,                   -- minutes
    max_daily_visits INTEGER DEFAULT 3,                    -- per patient
    blackout_start  TIME DEFAULT '06:00',                  -- morning rounds
    blackout_end    TIME DEFAULT '08:00',
    buffer_minutes  INTEGER DEFAULT 5,                     -- gap between visits
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, code)
);

-- ============================================================
-- 3. PATIENTS
-- ============================================================
CREATE TABLE patients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id),
    unit_id         UUID NOT NULL REFERENCES hospital_units(id),
    mrn             VARCHAR(50) NOT NULL,                  -- Medical Record Number
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    gender          VARCHAR(20),
    bed_number      VARCHAR(20) NOT NULL,
    admission_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    discharge_date  TIMESTAMPTZ,
    primary_language VARCHAR(10) DEFAULT 'en',
    is_conscious    BOOLEAN DEFAULT true,
    can_communicate BOOLEAN DEFAULT true,
    current_status  VARCHAR(50) DEFAULT 'STABLE',         -- FK to status enum
    status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    status_updated_by UUID,                                -- staff member who updated
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, mrn)
);

CREATE INDEX idx_patients_unit ON patients(unit_id) WHERE is_active = true;
CREATE INDEX idx_patients_bed ON patients(unit_id, bed_number) WHERE is_active = true;

-- ============================================================
-- 4. FAMILY MEMBERS
-- ============================================================
CREATE TABLE family_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    auth0_user_id   VARCHAR(255) UNIQUE,                   -- Auth0 sub claim
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    relationship    VARCHAR(50) NOT NULL,                   -- 'spouse', 'parent', 'child', 'sibling', 'other'
    phone           VARCHAR(20) NOT NULL,
    email           VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'en',
    is_next_of_kin  BOOLEAN DEFAULT false,
    is_pre_approved BOOLEAN DEFAULT false,                  -- auto-approve visits
    is_verified     BOOLEAN DEFAULT false,                  -- identity verified by staff
    verified_by     UUID,                                   -- staff member
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_patient ON family_members(patient_id) WHERE is_active = true;
CREATE INDEX idx_family_nok ON family_members(patient_id) WHERE is_next_of_kin = true;

-- ============================================================
-- 5. STAFF MEMBERS
-- ============================================================
CREATE TABLE staff_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id),
    auth0_user_id   VARCHAR(255) UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(30) NOT NULL,                   -- 'nurse', 'doctor', 'icu_admin', 'hospital_admin'
    employee_id     VARCHAR(50),
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    assigned_unit_id UUID REFERENCES hospital_units(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. VISIT SCHEDULES
-- ============================================================
CREATE TABLE visit_schedules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    family_member_id UUID NOT NULL REFERENCES family_members(id),
    unit_id         UUID NOT NULL REFERENCES hospital_units(id),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end   TIMESTAMPTZ NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',
                    -- 'pending', 'approved', 'declined', 'cancelled', 'completed', 'no_show', 'rescheduled'
    approved_by     UUID REFERENCES staff_members(id),
    decline_reason  TEXT,
    cancelled_by    VARCHAR(30),                            -- 'family', 'nurse', 'system'
    cancel_reason   TEXT,
    reminder_sent   BOOLEAN DEFAULT false,
    reminder_1hr_at TIMESTAMPTZ,
    reminder_15m_at TIMESTAMPTZ,
    is_emergency    BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visits_patient_date ON visit_schedules(patient_id, scheduled_start);
CREATE INDEX idx_visits_status ON visit_schedules(status, scheduled_start);
CREATE INDEX idx_visits_unit ON visit_schedules(unit_id, scheduled_start);

-- ============================================================
-- 7. VISIT SESSIONS (actual video calls)
-- ============================================================
CREATE TABLE visit_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id     UUID REFERENCES visit_schedules(id),    -- NULL for emergency sessions
    patient_id      UUID NOT NULL REFERENCES patients(id),
    daily_room_name VARCHAR(255) NOT NULL,                  -- Daily.co room identifier
    daily_room_url  VARCHAR(500) NOT NULL,
    session_token   TEXT,                                    -- encrypted meeting token
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    ended_by        VARCHAR(30),                             -- 'timer', 'nurse', 'family', 'system'
    duration_seconds INTEGER,
    max_quality     VARCHAR(20) DEFAULT '720p',
    min_quality_hit VARCHAR(20),                             -- lowest quality reached
    avg_bitrate_kbps INTEGER,
    participant_count INTEGER DEFAULT 0,
    is_emergency    BOOLEAN DEFAULT false,
    nurse_observer_id UUID REFERENCES staff_members(id),
    status          VARCHAR(20) DEFAULT 'created',
                    -- 'created', 'waiting', 'active', 'ended', 'failed'
    failure_reason  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_patient ON visit_sessions(patient_id, started_at);
CREATE INDEX idx_sessions_active ON visit_sessions(status) WHERE status = 'active';

-- ============================================================
-- 8. MOOD LOGS
-- ============================================================
CREATE TABLE mood_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES visit_sessions(id),
    respondent_type VARCHAR(20) NOT NULL,                   -- 'patient' or 'family'
    respondent_id   UUID NOT NULL,                          -- patient_id or family_member_id
    mood_score      INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
    mood_emoji      VARCHAR(10),                            -- '😊', '😐', '😢', '😰', '😴'
    felt_connected  VARCHAR(20),                            -- 'yes', 'somewhat', 'no'
    visit_again_today BOOLEAN,
    free_text       TEXT,                                    -- encrypted at application layer
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mood_session ON mood_logs(session_id);
CREATE INDEX idx_mood_patient ON mood_logs(respondent_id, submitted_at) WHERE respondent_type = 'patient';

-- ============================================================
-- 9. ASYNC MESSAGES
-- ============================================================
CREATE TABLE async_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    family_member_id UUID NOT NULL REFERENCES family_members(id),
    message_type    VARCHAR(20) NOT NULL,                   -- 'video', 'voice', 'photo', 'text'
    content_text    TEXT,                                    -- for text messages (encrypted)
    media_s3_key    VARCHAR(500),                            -- S3 object key for media
    media_duration_sec INTEGER,
    thumbnail_s3_key VARCHAR(500),
    status          VARCHAR(30) DEFAULT 'pending_review',
                    -- 'pending_review', 'approved', 'rejected', 'scheduled', 'delivered', 'expired'
    reviewed_by     UUID REFERENCES staff_members(id),
    review_note     TEXT,
    scheduled_play_at TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_async_patient ON async_messages(patient_id, status);
CREATE INDEX idx_async_pending ON async_messages(status) WHERE status = 'pending_review';

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_type  VARCHAR(20) NOT NULL,                   -- 'family', 'staff'
    recipient_id    UUID NOT NULL,
    channel         VARCHAR(20) NOT NULL,                   -- 'sms', 'email', 'push'
    event_type      VARCHAR(50) NOT NULL,
                    -- 'visit_requested', 'visit_approved', 'visit_declined', 'visit_reminder',
                    -- 'visit_started', 'status_update', 'emergency_alert', 'message_received'
    title           VARCHAR(255),
    body            TEXT NOT NULL,
    language        VARCHAR(10) DEFAULT 'en',
    reference_type  VARCHAR(50),                            -- 'visit_schedule', 'visit_session', 'async_message'
    reference_id    UUID,
    external_id     VARCHAR(255),                           -- Twilio SID / SendGrid ID
    status          VARCHAR(20) DEFAULT 'pending',
                    -- 'pending', 'sent', 'delivered', 'failed', 'read'
    sent_at         TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    failure_reason  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_id, created_at);
CREATE INDEX idx_notif_pending ON notifications(status, channel) WHERE status = 'pending';

-- ============================================================
-- 11. AUDIT LOGS (append-only, immutable)
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_type      VARCHAR(20) NOT NULL,                   -- 'family', 'staff', 'system'
    actor_id        UUID,
    action          VARCHAR(100) NOT NULL,
                    -- 'user.login', 'user.logout', 'visit.request', 'visit.approve',
                    -- 'visit.decline', 'session.start', 'session.end', 'session.mute',
                    -- 'patient.view', 'message.send', 'message.approve', 'alert.trigger',
                    -- 'status.update', 'consent.grant', 'consent.revoke', 'phi.access'
    resource_type   VARCHAR(50),                            -- 'patient', 'visit_schedule', 'visit_session', etc.
    resource_id     UUID,
    ip_address      INET,
    user_agent      TEXT,
    details         JSONB,                                  -- additional context
    hospital_id     UUID REFERENCES hospitals(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Append-only: Revoke UPDATE and DELETE
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_hospital ON audit_logs(hospital_id, created_at);

-- ============================================================
-- 12. PATIENT STATUS HISTORY
-- ============================================================
CREATE TABLE patient_status_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    status_code     VARCHAR(50) NOT NULL,
    display_text    VARCHAR(255) NOT NULL,
    updated_by      UUID NOT NULL REFERENCES staff_members(id),
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_patient ON patient_status_history(patient_id, created_at DESC);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all mutable tables
CREATE TRIGGER trg_hospitals_updated BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_units_updated BEFORE UPDATE ON hospital_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_family_updated BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_schedules_updated BEFORE UPDATE ON visit_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON visit_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_async_updated BEFORE UPDATE ON async_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```
