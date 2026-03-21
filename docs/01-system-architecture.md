# 1. System Architecture

## Overview

VisiCare follows a **microservices-oriented architecture** deployed on **AWS**, chosen for its HIPAA-eligible services (BAA available), broadest healthcare compliance certifications, and strong presence in India (Mumbai `ap-south-1` region).

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        INTERNET / CDN (CloudFront)                   │
└───────┬──────────────────┬──────────────────────┬────────────────────┘
        │                  │                      │
   ┌────▼────┐      ┌─────▼─────┐         ┌──────▼──────┐
   │ Family  │      │  Nurse    │         │  Hospital   │
   │ PWA App │      │ Dashboard │         │ Admin Panel │
   │ React   │      │ React     │         │ React       │
   └────┬────┘      └─────┬─────┘         └──────┬──────┘
        │                 │                       │
        └────────┬────────┴───────────────────────┘
                 │
        ┌────────▼────────┐
        │   AWS ALB       │  (Application Load Balancer + WAF)
        │   + API Gateway │
        └────────┬────────┘
                 │
    ┌────────────┼────────────────────────────────┐
    │            │        BACKEND SERVICES         │
    │  ┌─────────▼─────────┐  ┌─────────────────┐ │
    │  │  FastAPI Gateway   │  │  Auth Service   │ │
    │  │  (Main API)        │  │  (Auth0 + JWT)  │ │
    │  └──┬──┬──┬──┬───────┘  └─────────────────┘ │
    │     │  │  │  │                               │
    │  ┌──▼┐┌▼─┐┌▼──┐┌──▼──────────┐              │
    │  │Sch││Vi││Mo ││Notification │              │
    │  │edu││de││od ││  Service    │              │
    │  │ler││o ││Tr ││(Twilio/SG/ │              │
    │  │   ││Sx││ck ││ Firebase)  │              │
    │  └─┬─┘└┬─┘└┬──┘└──────┬─────┘              │
    │    │   │   │           │                     │
    │  ┌─▼───▼───▼───────────▼──┐                  │
    │  │     Message Broker      │                  │
    │  │     (Amazon SQS/SNS)    │                  │
    │  └────────────┬────────────┘                  │
    └───────────────┼──────────────────────────────┘
                    │
    ┌───────────────┼──────────────────────────────┐
    │    DATA LAYER │                               │
    │  ┌────────────▼──┐  ┌──────────────────────┐ │
    │  │  PostgreSQL   │  │  Redis               │ │
    │  │  (RDS)        │  │  (ElastiCache)       │ │
    │  │  AES-256 enc  │  │  Session/Cache       │ │
    │  └───────────────┘  └──────────────────────┘ │
    │  ┌───────────────┐  ┌──────────────────────┐ │
    │  │  S3 (Encrypted)│  │  CloudWatch Logs    │ │
    │  │  Async Media   │  │  Audit Trail        │ │
    │  └───────────────┘  └──────────────────────┘ │
    └──────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │         REAL-TIME VIDEO LAYER                 │
    │  ┌──────────────────────────────────────────┐│
    │  │         Daily.co Video API               ││
    │  │    ┌──────────┐  ┌────────────────┐      ││
    │  │    │ SFU      │  │ HIPAA Config   │      ││
    │  │    │ Servers  │  │ (E2E Encrypt)  │      ││
    │  │    └──────────┘  └────────────────┘      ││
    │  └──────────────────────────────────────────┘│
    └──────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │         PATIENT BEDSIDE UNIT                  │
    │  ┌──────────────┐  ┌──────────────────┐      │
    │  │ Android/iPad │  │ Nurse Control    │      │
    │  │ Kiosk Mode   │  │ Panel (Mute/End) │      │
    │  └──────────────┘  └──────────────────┘      │
    └──────────────────────────────────────────────┘
```

## Component Descriptions

### 1. Patient Bedside Unit
- **Hardware**: Android tablet or iPad in medical-grade enclosure (IP65-rated)
- **Software**: PWA running in kiosk mode with auto-launch on scheduled visits
- **Controls**: Nurse-controlled — can mute audio, disable video, or end session
- **Network**: Connected via hospital Wi-Fi with QoS prioritization for video

### 2. Family Web/Mobile App (PWA)
- **Progressive Web App** — no app store download required
- **Works on**: Desktop browsers, Android, iOS via browser
- **Features**: Visit booking, live video, async messages, mood check-ins, status feed
- **Offline**: Queues async messages for upload when connectivity restores

### 3. Hospital Staff Dashboard
- **Nurse Dashboard**: Manage active/upcoming visits, approve/decline requests, trigger emergency alerts, update patient status
- **Admin Dashboard**: Hospital-wide analytics, user management, compliance reports, audit log viewer

### 4. Scheduling Engine
- **Slot-based booking**: Configurable time slots per bed (default: 15-min slots, 3x daily)
- **Approval workflow**: Family requests → Nurse approval → Automated reminders
- **Conflict resolution**: Prevents double-booking, respects procedure blackout windows
- **Integration-ready**: Webhook endpoints for EHR calendar sync

### 5. Notification Service
- **Multi-channel**: SMS (Twilio), Email (SendGrid), Push (Firebase Cloud Messaging)
- **Event-driven**: Triggered by SQS/SNS events (booking confirmed, visit reminder, emergency alert)
- **Templates**: Multilingual message templates (Hindi, Tamil, Telugu, Kannada, Bengali, English)

### 6. Audit Log System
- **Immutable logging**: Every action logged to CloudWatch + PostgreSQL audit table
- **HIPAA-required events**: Login/logout, PHI access, session start/end, consent changes
- **Retention**: 7-year retention per HIPAA requirements
- **Export**: CSV/JSON export for compliance audits

## Cloud Provider Justification: AWS

| Criterion | AWS | GCP | Azure |
|-----------|-----|-----|-------|
| HIPAA BAA | ✅ Comprehensive | ✅ Available | ✅ Available |
| India Region | ✅ Mumbai (ap-south-1) | ✅ Mumbai | ✅ Pune, Mumbai |
| Healthcare Certifications | ✅ HITRUST, SOC 2 | ✅ SOC 2 | ✅ HITRUST |
| Managed PostgreSQL | ✅ RDS | ✅ Cloud SQL | ✅ Flexible Server |
| Video Integration | ✅ Chime SDK (backup) | ⚠️ Limited | ⚠️ Limited |
| Cost (Startup) | ✅ Free tier + credits | ✅ Free tier | ✅ Free tier |
| India Healthcare Adoption | ✅ Highest | ⚠️ Growing | ⚠️ Growing |

**Decision**: AWS provides the most comprehensive HIPAA-eligible service coverage, strongest India presence, and the broadest ecosystem for healthcare workloads.

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│                 SECURITY LAYERS                  │
├─────────────────────────────────────────────────┤
│ Layer 1: Network    │ VPC, Private Subnets,     │
│                     │ Security Groups, NACLs     │
├─────────────────────┤─────────────────────────── │
│ Layer 2: Edge       │ CloudFront + AWS WAF       │
│                     │ DDoS Protection (Shield)   │
├─────────────────────┤─────────────────────────── │
│ Layer 3: Transport  │ TLS 1.3 everywhere         │
│                     │ DTLS-SRTP for video        │
├─────────────────────┤─────────────────────────── │
│ Layer 4: Application│ JWT + RBAC (Auth0)         │
│                     │ Rate Limiting, Input Valid. │
├─────────────────────┤─────────────────────────── │
│ Layer 5: Data       │ AES-256 at rest (KMS)      │
│                     │ Column-level encryption     │
├─────────────────────┤─────────────────────────── │
│ Layer 6: Audit      │ CloudTrail, CloudWatch,    │
│                     │ Immutable Audit Logs       │
└─────────────────────────────────────────────────┘
```

## Deployment Architecture

- **Container Orchestration**: Amazon EKS (Kubernetes)
- **Container Registry**: Amazon ECR
- **CI/CD**: GitHub Actions → ECR → EKS rolling deployments
- **Environments**: `dev` → `staging` → `production`
- **Infrastructure as Code**: Terraform
- **Secrets Management**: AWS Secrets Manager
- **Monitoring**: CloudWatch + Grafana + PagerDuty for alerting
