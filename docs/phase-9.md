# Phase 9: Offline, Bilingual, Passkeys

Three threads that together bring the app closer to what members
actually experience in the field: patchy connectivity, Luganda as a
first language, and password-fatigued authentication.

## 1. Offline mutation queue

### The problem

Members in rural catchment areas lose their connection mid-transaction.
Today the UI just throws an error and they're left wondering whether
the deposit went through. We want: enqueue locally, drain on reconnect,
never duplicate a payment.

### The design

- **Storage**: IndexedDB database `iffe-offline`, object store
  `mutations`, primary key `id` (ULID-ish, generated at enqueue).
- **Enqueue path**: `apps/web/src/lib/api-client.ts` catches the
  network error on every mutating request and calls
  `enqueue()` from `offline-queue.ts`. Each entry gets an
  `Idempotency-Key` header so the server dedupes on replay.
- **Drain path**: `drain()` replays queued mutations in enqueue order.
  - `2xx` → remove from queue
  - `4xx` (not `408`/`429`) → remove and count as permanent failure
  - `5xx` / `408` / `429` / network → stop, retry next online event
- **Triggers**: the `online` event handler installed by
  `installAutoDrain()` and, on modern browsers, `sync.register('drain-offline-queue')` with Background Sync.
- **UI**: `<OfflineBanner />` watches the queue via
  `useOfflineQueue()` and renders three states:
  1. offline → amber "you're offline" banner with pending count
  2. online + queue > 0 → blue "syncing N actions" banner
  3. online + queue 0 → nothing

### Why not just optimistic updates?

Optimism is fine for reads; it's dangerous for money. The queue
approach is explicit: the user sees that their action is **pending**,
and the server-side idempotency key guarantees exactly-once semantics
even if the browser replays the request twice.

### Gotchas

- Never enqueue GET requests. Reads should fail loudly so the UI can
  switch into "cached dashboard" mode.
- The `Idempotency-Key` header is the contract between client and
  server — don't strip it in any intermediary.
- Phase 1's `IdempotencyKey` model stores the response body so the
  replay gets the same result; this is what makes the whole thing safe.

## 2. Bilingual i18n (English + Luganda)

### Why Luganda

A Ugandan SACCO audience skews bilingual — English in formal contexts,
Luganda at home. Translating the portal (member-facing) pages is high
ROI; translating the admin dashboards is low ROI (staff are formally
trained in English). The string inventory reflects this: `common`,
`auth`, `portal`, `notifications`, `passkeys`, `assistant`.

### The design

- `apps/web/src/i18n/config.ts` — locale list, resolver (cookie →
  profile → Accept-Language → default).
- `apps/web/src/i18n/messages/{en,lg}.json` — translation files with
  ICU-ish placeholders: `{name}`, `{count, plural, ...}`.
- `apps/web/src/i18n/get-messages.ts` — lazy loader so only one
  locale's JSON ships per chunk.
- `apps/web/src/i18n/provider.tsx` — minimal client-side
  `I18nProvider` + `useTranslations()` hook. The runtime formatter is
  ~20 lines of code; when we outgrow it we swap in `next-intl` or
  `@lingui/core` without touching consumer sites.
- `apps/web/src/components/locale-switcher.tsx` — a two-option
  dropdown that writes the cookie, PATCHes `/auth/profile` to
  persist to the user's row, and reloads.
- `apps/web/src/components/offline-banner.tsx` — uses `useTranslations()`.

### Persistence

Three layers, first match wins:
1. `iffe-locale` cookie (set by the switcher, works without a session)
2. `users.locale` column on the authenticated user
3. `Accept-Language` header
4. Default `en`

### Adding a string

1. Add the key to `messages/en.json` (the source of truth).
2. Add the Luganda translation to `messages/lg.json`.
3. Call `t("section.key", { ...params })` in the component.

Missing Luganda keys fall back to the key name — visible during dev so
translators can spot gaps.

## 3. Passkey authentication (WebAuthn)

### Why

Passwords on phones in 2026 are a usability tax. Passkeys work with
phone biometrics, hardware keys, and platform authenticators — and
they're phishing-resistant by construction. For a SACCO in East Africa
where Android biometrics are ubiquitous, this is a huge UX + security win.

### The design

- **Schema**: new `Passkey` model (credentialId unique, publicKey bytes,
  counter, transports, nickname, deviceType, backedUp) and
  `WebAuthnChallenge` for one-shot challenge persistence.
- **Library**: `@simplewebauthn/server` on the API,
  `@simplewebauthn/browser` on the web. Imported dynamically so the
  dep isn't required for boots that don't use passkeys.
- **Service**: `apps/api/src/services/passkey.service.ts` handles
  `generateRegistrationOptions`, `verifyRegistration`,
  `generateAuthenticationOptions`, `verifyAuthentication`, `list`,
  `remove`. The RP ID comes from `APP_BASE_URL` so it's consistent
  across environments.
- **Endpoints**:
  - `POST /passkeys/register/options` (auth required)
  - `POST /passkeys/register/verify` (auth required)
  - `GET /passkeys` — list the caller's enrolled credentials
  - `DELETE /passkeys/:id` — remove one
  - `POST /passkeys/login/options` (public, rate-limited, CSRF-exempt)
  - `POST /passkeys/login/verify` (public, rate-limited, issues a
    normal session cookie on success)
- **Client hook**: `usePasskey()` wraps enrol + login flows with
  friendly error messages.

### Rollout

1. Feature flag `passkeyAuth` in Edge Config starts `false`.
2. Enable for admin role first — they're the smallest blast radius and
   they hold the highest-risk credentials.
3. Once stable, open to staff, then chairman, then members.
4. Password login remains available as a fallback; members who lose
   all their passkeys can reset via email.

### Security notes

- `userVerification: "preferred"` — authenticator-dependent;
  platform authenticators with biometrics will actually verify.
- `residentKey: "preferred"` — enables usernameless login where
  supported. Falls back to email+passkey when not.
- Counter is checked to detect cloned authenticators; any anomaly is
  logged and the session is rejected.
- The challenge table has a TTL index and is consumed exactly once.

## Rollout checklist

- [ ] `bun install` (new deps: `@simplewebauthn/server`, `@simplewebauthn/browser`)
- [ ] Apply migration: `bunx prisma migrate deploy`
- [ ] Set `APP_BASE_URL` to the production origin (RP ID is derived
      from its hostname — must match the browser's Origin)
- [ ] Enable `passkeyAuth` flag for admin only via Edge Config
- [ ] Ask one translator to review the Luganda strings before enabling
      the locale switcher in production
- [ ] Verify that the offline banner shows up when you kill the
      network in DevTools and that a queued mutation drains on reconnect
