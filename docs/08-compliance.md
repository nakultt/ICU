# 8. Compliance Checklist

## A. HIPAA Compliance (USA)

### Technical Safeguards
| # | Requirement | VisiCare Implementation | Status |
|---|------------|------------------------|--------|
| 1 | Encryption in transit | TLS 1.3 for all API traffic; DTLS-SRTP for video media | ✅ |
| 2 | Encryption at rest | AES-256 via AWS KMS for PostgreSQL (RDS), S3, and Redis | ✅ |
| 3 | Access controls | Auth0 RBAC with 4 roles; MFA for staff accounts | ✅ |
| 4 | Unique user identification | UUID-based user IDs; Auth0 sub claims | ✅ |
| 5 | Automatic logoff | 15-min JWT expiry; 30-min session timeout | ✅ |
| 6 | Audit controls | Immutable audit_logs table; CloudTrail; 7-year retention | ✅ |
| 7 | Integrity controls | Database constraints; input validation via Pydantic | ✅ |
| 8 | Transmission security | WSS for WebSocket signaling; no unencrypted channels | ✅ |

### Administrative Safeguards
| # | Requirement | VisiCare Implementation | Status |
|---|------------|------------------------|--------|
| 9 | BAA with video provider | Daily.co HIPAA Healthcare add-on with signed BAA | ✅ |
| 10 | BAA with cloud provider | AWS BAA signed for all HIPAA-eligible services | ✅ |
| 11 | BAA with notification providers | Twilio BAA + SendGrid BAA | ✅ |
| 12 | Risk analysis | Annual security risk assessment documented | ✅ |
| 13 | Workforce training | Mandatory HIPAA training for all staff users | ✅ |
| 14 | Incident response plan | Data breach notification within 60 days (HIPAA) | ✅ |
| 15 | Minimum necessary standard | Role-based data access; families see no PHI | ✅ |
| 16 | No recording by default | Video sessions not recorded; configurable per policy | ✅ |

### Physical Safeguards
| # | Requirement | VisiCare Implementation | Status |
|---|------------|------------------------|--------|
| 17 | Workstation security | Bedside tablets in kiosk mode; auto-lock after session | ✅ |
| 18 | Device management | MDM (Mobile Device Management) for hospital tablets | ✅ |
| 19 | Facility access controls | AWS data centers SOC 2 certified | ✅ |

---

## B. GDPR Compliance (EU/International)

| # | Requirement | VisiCare Implementation | Status |
|---|------------|------------------------|--------|
| 1 | Lawful basis for processing | Explicit consent obtained at registration | ✅ |
| 2 | Right to access | Family can view/export their data via Settings | ✅ |
| 3 | Right to erasure | Data deletion API; 30-day grace period | ✅ |
| 4 | Right to rectification | Family can edit profile data | ✅ |
| 5 | Data portability | JSON export of all personal data | ✅ |
| 6 | Data Protection Officer | DPO appointed for enterprise tier hospitals | ✅ |
| 7 | Privacy by design | Minimal data collection; no unnecessary PHI | ✅ |
| 8 | Breach notification | Automated alerts within 72 hours to authorities | ✅ |
| 9 | Consent withdrawal | One-click consent withdrawal in app | ✅ |
| 10 | Cross-border transfers | AWS EU regions available; data residency options | ✅ |
| 11 | Data minimization | Only essential data collected per purpose | ✅ |
| 12 | Privacy impact assessment | DPIA documented for new features | ✅ |

---

## C. India DPDP Act 2023 Compliance

| # | Requirement | VisiCare Implementation | Status |
|---|------------|------------------------|--------|
| 1 | Explicit informed consent | Consent screen with purpose specification at registration | ✅ |
| 2 | Purpose limitation | Data used only for stated visit facilitation purposes | ✅ |
| 3 | Data fiduciary obligations | Hospital designated as data fiduciary; VisiCare as processor | ✅ |
| 4 | Data Protection Officer | DPO appointment supported for Significant Data Fiduciaries | ✅ |
| 5 | Deemed consent (emergencies) | Emergency alerts trigger deemed consent for life-threatening situations | ✅ |
| 6 | Right to access | Patients/families can view how data is processed | ✅ |
| 7 | Right to correction | Incorrect data can be corrected via app or support | ✅ |
| 8 | Right to erasure | Data deletion on request; retention minimized | ✅ |
| 9 | Right to withdraw consent | In-app consent withdrawal; data processing stops | ✅ |
| 10 | Right to nominate | Family member can nominate representative for deceased/incapacitated patients | ✅ |
| 11 | Breach notification | Data Protection Board of India notified within 72 hours | ✅ |
| 12 | Data localization | India patient data stored in AWS Mumbai (ap-south-1) | ✅ |
| 13 | Penalties awareness | Compliance program to avoid fines up to ₹250 crore | ✅ |
| 14 | Children's data (if applicable) | Verifiable guardian consent for minor patients | ✅ |
| 15 | Reasonable security safeguards | AES-256 encryption, access controls, audit logs | ✅ |

---

## D. Healthcare-Specific Standards

| Standard | Relevance | VisiCare Approach |
|----------|-----------|-------------------|
| **HL7 FHIR** | EHR integration | FHIR R4 APIs for patient data exchange (V2) |
| **DICOM** | Not applicable | N/A — no medical imaging |
| **IHE XDS** | Document sharing | Future integration for care summary sharing |
| **SOC 2 Type II** | Service org controls | Annual audit planned for enterprise tier |
| **ISO 27001** | Information security | ISMS framework adopted |
| **HITRUST CSF** | Healthcare security | Certification planned for Year 2 |
