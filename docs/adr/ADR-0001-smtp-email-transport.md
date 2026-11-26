# ADR-0001: SMTP email transport alongside Resend

- Status: accepted
- Date: 2026-11-25

## Context and Problem Statement

The API sent email only through Resend (`RESEND_API_KEY`). Without that key, `sendEmail` logged the message and sent nothing, so credentials, password resets and notifications silently stopped. The SACCO has a Gmail mailbox with an app password but no Resend account set up. How should the API send mail from an ordinary SMTP mailbox without dropping Resend?

## Decision Outcome

Add an SMTP transport to `sendEmail` in `apps/api/src/services/email.service.ts`, using `nodemailer`.

- Precedence: SMTP when `SMTP_HOST` is set, then Resend when `RESEND_API_KEY` is set, then the log-only stub.
- TLS is always required: implicit TLS on port 465, enforced STARTTLS on any other port (default 587).
- Mail is sent from `SMTP_USER`, because Gmail rewrites or rejects any other From address.
- Connection and greeting timeouts are 10 s and the socket timeout is 15 s, so an unreachable server can't hold a request past the 30 s serverless limit.
- Failures are logged as `email.send_failed` with `transport: "smtp"` and thrown, matching the Resend path. Callers decide whether to continue.

nodemailer is bundled into the self-contained API bundle (`apps/web/scripts/prebuild.sh`), so deploys need no changes.

## Consequences

- Good: email works with any SMTP mailbox, and Resend still works unchanged when `SMTP_HOST` is unset.
- Bad: Gmail limits sending to about 500 recipients a day and offers no domain branding. Mail comes from a personal-style address.
- Bad: one more secret (`SMTP_PASS`) to rotate. See `docs/runbooks/secrets-rotation.md`.
- Neutral: one new runtime dependency (`nodemailer`).

## Confirmation

- `apps/api/src/services/email.service.test.js` covers transport options (STARTTLS on 587, implicit TLS on 465), the From address, precedence over Resend, and error propagation.
- A real nodemailer send to an unreachable `smtp.gmail.com` failed after 10 s with `email.send_failed` logged.
