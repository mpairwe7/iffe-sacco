# Runbook: Auth Incident

**Owner:** Security lead + Platform on-call
**SLO:** Triage within 15 minutes; contain within 1 hour

## Triggers

- Alert: `auth.failure_spike` (5× baseline failure rate sustained 5 min)
- Alert: `botid.block_spike` paired with auth spike
- Out-of-band report: "I see unfamiliar logins on my account"
- Unusual pattern in audit logs (e.g., role changes outside business hours)

## Immediate action

1. **Snapshot the current auth state.**

   ```bash
   curl -s $API/api/v1/health/ready | jq
   ```

2. **Count active sessions and recent failures.**

   ```sql
   -- Active sessions right now
   SELECT COUNT(*) FROM sessions WHERE "revokedAt" IS NULL AND "expiresAt" > NOW();

   -- Failed logins in last 30 minutes (from audit logs if present)
   SELECT COUNT(*), "ipAddress"
   FROM audit_logs
   WHERE action = 'login_failed' AND "createdAt" > NOW() - INTERVAL '30 minutes'
   GROUP BY "ipAddress"
   ORDER BY COUNT(*) DESC
   LIMIT 20;
   ```

3. **Check rate-limit / lockout counters** (Upstash dashboard or process memory).

## Containment options

Pick the narrowest action that stops the attack.

### Option 1: Tighten rate limits temporarily

Set env vars on preview and re-deploy:

```
AUTH_RATE_LIMIT_MAX_ATTEMPTS=3
AUTH_RATE_LIMIT_WINDOW_MS=3600000
```

### Option 2: Block attacker IPs

If a small number of IPs are responsible, add them to Vercel firewall
rules in the dashboard. Prefer this over per-app denylists so the
request never hits the function.

### Option 3: Mass-revoke sessions for an affected user

```sql
UPDATE sessions
SET "revokedAt" = NOW()
WHERE "userId" = '<user_id>' AND "revokedAt" IS NULL;
```

### Option 4: Force password reset for an affected user

Via admin endpoint:

```bash
curl -X POST $API/api/v1/users/<id>/force-reset \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Option 5: Disable login globally (extreme)

Flip `auth.loginEnabled = false` in Edge Config. The login endpoint
returns a 503 until the flag is flipped back. Coordinate announcement.

## Diagnosis

- Any new admin accounts? `SELECT * FROM users WHERE role='admin' ORDER BY "createdAt" DESC LIMIT 10;`
- Any password resets confirmed? `SELECT COUNT(*) FROM password_reset_tokens WHERE "usedAt" > NOW() - INTERVAL '1 hour';`
- Any sensitive audit actions? `SELECT * FROM audit_logs WHERE action IN ('role_change','password_reset','user_created') AND "createdAt" > NOW() - INTERVAL '1 hour';`
- Sentry errors matching `HTTPException(401)` volume pattern?

## Recovery

Once contained:

1. [ ] Rotate `JWT_SECRET` per [secrets-rotation](./secrets-rotation.md)
       to invalidate every existing session.
2. [ ] Reset passwords for any accounts with confirmed compromise.
3. [ ] Audit `audit_logs` for unauthorized actions during the window
       and reverse where possible (post corrective journal entries, etc.).
4. [ ] Re-enable normal rate limits.
5. [ ] Post-mortem within 24 hours.

## Prevention follow-ups

- [ ] Lower account-lockout threshold if this recurs.
- [ ] Enable passkey (WebAuthn) for admin roles first.
- [ ] Add BotID verification on password reset requests too (not just login).
- [ ] Consider requiring MFA for role changes and payment gateway edits.
