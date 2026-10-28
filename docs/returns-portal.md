# Deals & Steals returns portal

## What ships

- `/returns`: one-item claim form, Square receipt lookup with manual fallback, receipt upload only for unmatched purchases, item photos, before-tax item amount, and late-exception explanation.
- `/returns/claim?id=…#key=…`: private customer status, messages, and evidence uploads. No customer account needed.
- `/returns/admin`: email-link staff login, claim queue, partial approvals, late exceptions, return/keep/dispose decisions, destruction evidence review, 14-day return deadlines/extensions, staff notes, and in-person credit recording.
- Active admins are both the access list and the notification list. Seed admins: `keeley@dealsandstealsmd.com`, `chris@dealsandstealsmd.com`. Future admins can be added or removed in the dashboard. Removed admins lose existing sessions and unused login links immediately. Pending admin alerts are skipped after removal.
- Customer emails use all active admins as reply-to recipients. Replies sent through the private claim page appear in the dashboard. Direct email replies arrive in admins' inboxes; this version does not import inbox replies into the claim history.
- This portal records credit staff have already processed in person; it does not issue Square refunds, adjust loyalty, or issue gift cards.

## Production setup

The website already uses Vercel, Square, Resend, and Turnstile. This change adds a Supabase Postgres database and private Storage bucket. No service credential is included in source code.

1. Create a Supabase project (or use an approved existing project). Run `supabase/migrations/20261028_returns.sql` once in its SQL editor. It creates the tables, service-role-only RPCs, private bucket, and two initial admins. Do not add public storage policies.
2. Set server-side Vercel environment variables:
   - `RETURNS_SUPABASE_URL`: project HTTPS URL.
   - `RETURNS_SUPABASE_SERVICE_ROLE_KEY`: server-only service role key; never use a NEXT_PUBLIC variable for it.
   - `RETURNS_SITE_URL`: canonical URL for this environment, with no path. Production: `https://www.dealsandstealsmd.com`. For a staging deployment, use its own origin. Requests from other origins are rejected and email links use this value.
   - `RETURNS_LINK_SECRET`: a new random 32-byte secret, generated with `openssl rand -hex 32`. Keep it stable and backed up; changing it requires a customer-link reissue/migration.
   - `RETURNS_CRON_SECRET`: a different random 32-byte secret for the email retry endpoint.
   - Optional `RETURNS_FROM_EMAIL`: verified Resend sender for returns. Otherwise the existing `JOBS_FROM_EMAIL` is reused.
3. Reuse existing `RESEND_API_KEY`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, optional `SQUARE_API_VERSION`, `TURNSTILE_SECRET_KEY`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Allow the production and staging hostnames in Turnstile. Square requires `PAYMENTS_READ` and `ORDERS_READ`; a catalog-only OAuth token is insufficient. Keep staging connected to test accounts rather than real customer data.
4. Configure an external scheduler to GET `/api/returns/mail-retry` every five minutes with `Authorization: Bearer <RETURNS_CRON_SECRET>`. Notifications are stored atomically with claim changes, delivery is attempted immediately, and admins can retry from the dashboard. Each invocation processes at most ten emails; run more frequently if volume requires it. Resend's idempotency header reduces duplicate deliveries during concurrent retries. Monitor pending/failed counts. No claims are discarded because email fails.
5. Deploy this branch to a Vercel preview with the above variables, then perform the acceptance walkthrough below before merging to production.

The application deliberately fails closed when required storage, sign-in, or bot protection settings are absent. A successful build does not confirm the live Square permissions, Resend sender, or Supabase settings.

## Policy behavior

In-person sales use payment date; prepaid online sales use customer-reported actual pickup date. The 7-day window includes the seventh calendar day through the end of that day in America/New_York. Online pickup may be much later than payment. Impossible/future dates are rejected. Late claims are accepted only with an exception explanation, and require an explicit staff exception checkbox for approval. As-is claims are rejected on both client and server.

Square lookup compares receipt number, exact receipt/payment date in Eastern time, final receipt total, USD currency, completed payment, and configured location. It paginates payments and retrieves the associated order, so split payments can match the full order total. It returns only item names, line quantities, and before-tax line totals, never customer, card, or loyalty details. The lookup proof is server-signed and expires after 30 minutes. Recognized POS/Retail/Restaurant/Terminal payments use the verified payment date and in-person clock. Other channels retain the customer's declared purchase channel for staff verification. A valid Square match replaces the receipt upload. Unmatched or expired lookup proofs require a receipt photo/PDF for manual review; item photos remain required. Staff must verify purchase channel, pickup, eligibility, previous returns/refunds/claims and item identity before approving. Named and generic receipt lines both allow a customer description and actual per-item price; selecting a multi-quantity line does not assume that its line total is the price of one item.

Amounts are integer cents. Item price is after discounts and before tax; receipt total includes tax. Partial credit cannot exceed the claimed before-tax item price. Tax handling stays with the actual in-store credit/redemption process. Gift card issuance and automatic tax refund calculation are intentionally deferred.

Approvals requiring physical return set a deadline 14 calendar days after the approval date. Expired deadlines must be extended by staff before credit can be recorded. Keep/dispose exceptions are explicit decisions. If destruction evidence is required, uploads move the claim to evidence review; staff must accept the evidence before recording credit. Staff can request clearer evidence. Credits require a method/reference and, for physical returns, confirmation of receipt. Once credited, a claim cannot be credited again through this portal.

## Security and data

All tables enable RLS with no anon/authenticated grants or public policies. Only Next.js server routes hold the service role key. Staff login tokens are random, hashed in storage, valid for 15 minutes and consumed atomically. Sessions are random and hashed, expire after 8 hours, and use HttpOnly/SameSite=Strict/Secure cookies in HTTPS environments. Every staff request rechecks the current admin list. State-changing routes check the configured origin. Public creation, receipt lookup, and login require Turnstile and persistent rate limits. Claim replies require the private claim token and have a per-claim rate limit.

Customer links carry the bearer key in a fragment; it is moved to sessionStorage after opening so it is not included in request URLs or server logs. API requests use the Authorization header. The key should be treated as a password. Customer responses omit internal notes and Square payment/order IDs. Responses and attachments are no-store; return pages use no-referrer and noindex metadata. Files are private, validated by MIME type and magic bytes, limited to five per submission and 3 MB combined, and downloaded through authorized routes as attachments. Only receipt files can be PDF; item and evidence files are photos. Maximum 25 files per claim. File checks are not malware scanning.

Claim state and audit events are stored together under optimistic version checks. Email outbox entries are committed in the same database transaction. Submission IDs plus an independent request secret make retries idempotent without granting access based on claim ID alone. Evidence uploads are removed if the database write fails; an infrastructure interruption between upload and commit can still leave an orphan, so periodically reconcile private objects against claim attachment paths.

Set a retention policy for customer contact details, receipts, photos, closed claims, and email outbox bodies before operating at volume. Periodically delete expired login/session/rate-limit rows. Example maintenance SQL (does not delete claims):

```sql
delete from returns_login_tokens where expires_at < now();
delete from returns_sessions where expires_at < now();
delete from returns_limits where resets_at < now() - interval '1 day';
```

## Validation

Requires Node 22.18+ for the test runner's TypeScript stripping.

```sh
npm ci
npm run test:returns
npm run build
```

Database tests execute the actual migration in an embedded Postgres engine with a stub Storage schema. They cover seeded admins, private tables/bucket, anonymous privilege denial, atomic claim/outbox updates and rollback, concurrent version protection, single-use login consumption, and persistent rate limits. Policy tests cover payment/pickup clocks, Eastern dates and DST, late explanation, as-is exclusion, input validation, partial credit, 14-day deadlines/extensions, required destruction evidence, in-person credit prerequisites, and staff notes.

Live acceptance walkthrough (after configuration):

1. Open the form on phone/desktop. Test bot protection and upload limits. Match a real staging Square receipt; try a wrong total and generic receipt line. Confirm no customer/card data is exposed.
2. Submit an in-period POS claim and online prepaid claim with later pickup. Submit a late claim with an explanation and verify it is flagged. Try an as-is claim and confirm rejection.
3. Confirm the customer acknowledgement and alerts to both seeded admins. Open the customer link; ensure a wrong key cannot access the claim or files.
4. Sign in using a one-use email link. Verify replay/expiration and access denial for an unlisted address. Add/remove a test admin; check notifications and immediate session revocation.
5. Approve a partial return, confirm the 14-day deadline and customer email. Confirm credit is blocked without returned-item confirmation, after expiry, or without a transaction reference. Extend and record credit only after actually processing it in the test POS.
6. Exercise keep/dispose decisions with and without evidence. Ensure uploaded destruction evidence requires staff acceptance. Confirm staff notes are absent from customer views.
7. Open the same claim in two staff tabs and save competing changes; the stale tab must get a conflict. Disable email delivery temporarily: the claim must stay saved, queue status must appear, and retry must deliver after recovery.

Browser preview in the development environment was unavailable because the managed launcher adds Vite flags (`--host`, `--strictPort`) to `next dev`. No application code was changed to work around that infrastructure mismatch. Use the Vercel preview for visual and live-service checks.
