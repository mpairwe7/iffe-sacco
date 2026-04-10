# Compliance & Data Protection

IFFE SACCO operates under Ugandan cooperative and microfinance
regulation and processes personally identifiable information (PII)
about members including national IDs, family relationships, and
financial history.

This document records the posture and the controls — not legal
advice. Revisit with counsel before any production go-live.

## Regulatory surface area (Uganda)

| Regime | Authority | Scope |
|---|---|---|
| Tier 4 Microfinance Institutions and Money Lenders Act (2016) | UMRA | Governance, reporting, consumer protection |
| Cooperative Societies Act (Cap 112) | Ministry of Trade, Industry and Cooperatives | Registration, bylaws, audit |
| Data Protection and Privacy Act (2019) | NITA-U | PII processing, data subject rights |
| Financial Institutions (Anti-Money Laundering) Regulations | Bank of Uganda / FIA | KYC, CTR, STR reporting |
| NCCA guidance for SACCOs | Ministry | Governance, election, audit |

## Data protection controls

### Data minimization

The schema requires only fields that are strictly necessary for
member identification, KYC, and welfare / mutual-aid tracking.
Discretionary fields (clan, totem, ancestral origin) are retained
only when the member voluntarily provides them.

### Lawful basis

- **Contract**: member onboarding, account operation, loan processing.
- **Legal obligation**: audit logs, AML reporting.
- **Legitimate interest**: fraud prevention, service improvement.
- **Consent**: marketing communications (not yet implemented — will
  require an opt-in table before launch).

### Data subject rights

| Right | Endpoint | Notes |
|---|---|---|
| Access / Portability | `GET /api/v1/gdpr/members/:id/export` | Admin-only, audited, returns full JSON dump |
| Erasure | `POST /api/v1/gdpr/members/:id/delete` | Soft delete + anonymization; financial ledger retained for regulatory compliance |
| Rectification | Existing member edit endpoints | Admin role required |
| Objection | Manual process pending consent table | Contact data protection officer |
| Restriction | Account status `frozen` | Admin role required |

### Retention policy

| Data class | Retention | Justification |
|---|---|---|
| Journal entries | Indefinite | Regulatory audit trail |
| Audit logs — financial actions | 10 years | Regulatory audit trail |
| Audit logs — auth/session | 2 years | Security investigation window |
| Password reset tokens | Single use, 30-min TTL | Security |
| Idempotency keys | 24h | Request replay window |
| Sessions | Until revoke or TTL (24h / 7d remember-me) | Minimum viable for UX |
| Member PII (name, contact, family) | Until deletion request | Data subject control |
| Applications | 7 years | Regulatory membership records |

### PII encryption

- In transit: TLS 1.3 enforced via Vercel (HSTS preload).
- At rest: Neon Postgres uses AES-256 at the storage layer (managed).
- Payment gateway credentials: **envelope-encrypted** via
  `CREDENTIALS_KEK` (see `apps/api/src/utils/crypto.ts`).
- Passwords: bcryptjs with per-platform salt rounds.

## AML / KYC (planned)

Not yet implemented — Phase 7 scaffold lives at
`apps/api/src/services/fraud-scoring.service.ts`. Minimum viable
before production:

- [ ] Document-verification step in the application workflow
  (Smile ID or Onfido via Vercel Marketplace)
- [ ] Currency transaction reporting threshold alerts (UGX equivalent
      of USD 10k — configurable)
- [ ] Suspicious transaction report (STR) generator for the
      compliance officer
- [ ] PEP + sanctions list screening at onboarding
- [ ] Recurring customer due diligence on high-risk members

## Incident reporting

Data breach notification is required within 72 hours under the DPPA.

1. On detection: file incident in #incidents, assemble response team.
2. Identify scope: which members, which fields, time window.
3. Contain: rotate keys if credential leak; PITR restore if data loss.
4. Notify: NITA-U, affected members, BoU/UMRA as applicable.
5. Document: post-mortem, regulator correspondence, remediation plan.

See also [auth-incident runbook](./runbooks/auth-incident.md) and
[secrets-rotation runbook](./runbooks/secrets-rotation.md).

## Open items before production

- [ ] Data Protection Officer (DPO) appointed and contact published
- [ ] Privacy notice + terms of service reviewed by counsel
- [ ] Member consent captured at application (explicit opt-in UI)
- [ ] DPIA (Data Protection Impact Assessment) documented for fraud scoring
- [ ] AML program documented and approved by board
- [ ] UMRA reporting cadence established and automated
