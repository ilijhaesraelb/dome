# D.O.M.E. — USCIS Production API Access Request

**Prepared for:** USCIS API review / production access approval
**Prepared by:** AREI GROUP (D.O.M.E. platform)
**Date:** [INSERT DATE]

---

## 1. Who we are

D.O.M.E. — **Digital Onboarding for Migration Ease** — is a web-based immigration and tax-assistance
platform operated by **AREI GROUP**, a private company. D.O.M.E. is not affiliated with, endorsed by,
or sponsored by USCIS, DHS, or any government agency; it is a client-facing service that helps
immigrants and the accredited representatives/attorneys who work with them organize documentation,
understand eligibility pathways, and track the status of cases they have already filed with USCIS.

- **Product:** D.O.M.E. (domeai.org)
- **Point of contact:** [INSERT NAME, TITLE]
- **Contact email:** Info@domeai.org / [INSERT DIRECT EMAIL]
- **Company:** AREI GROUP
- **Current environment:** USCIS sandbox/demo (`demo_id: 3879` against `api-int.uscis.gov`)
- **Requesting:** Production access to the **Case Status API**, and clarification on the correct
  channel for **office-locator** data (see §5)

## 2. What the product does

D.O.M.E. gives users (immigrants, and the accredited representatives/attorneys assisting them) a
single place to:

- Discover which immigration pathway(s) they may be eligible for (a guided eligibility wizard)
- Prepare and organize supporting documents for a case
- Track the status of a case they have already filed, using their own USCIS receipt number
- Find nearby USCIS field offices, Application Support Centers, and embassies/consulates
- Get plain-language, multi-language (11 languages) explanations of form questions and immigration
  concepts, and a voice-guided assistant for users who have difficulty reading or typing forms

USCIS integrations are a small, specific part of this: they let a user who already has a receipt
number check on their own case, and let a user find the nearest physical office. D.O.M.E. does not
file anything with USCIS on the user's behalf, does not submit forms through these APIs, and does not
bulk-query or scrape case data — every call is triggered by a single logged-in user acting on their
own case.

## 3. How the Case Status API is used

**Endpoint:** `POST /uscis-case-status` (our own backend function) → proxies to USCIS's
`case-status` API at `api-int.uscis.gov`.

**Flow:**
1. A logged-in user enters a USCIS receipt number they already have (their own case).
2. Our backend validates the format (`^[A-Z]{3}\d{10}$`) before calling USCIS at all — malformed
   input never reaches the USCIS API.
3. Our backend authenticates itself to USCIS using OAuth2 **client-credentials** grant
   (`client_id` / `client_secret`), obtains a bearer token, and caches it in memory until ~60
   seconds before expiry to avoid re-requesting a token on every call.
4. The backend calls `GET /case-status/{receiptNumber}` with the cached token and passes the raw
   USCIS response back to the user's browser.
5. USCIS error codes (400/401/403/404/422/429/503) are translated into plain-language messages for
   the end user (e.g. explaining the API's Mon–Fri 7am–8pm ET service window on a 503).

**Why we need production access:** the sandbox/demo environment only returns test fixture data tied
to the demo receipt numbers, so we cannot validate the end-to-end user experience against real case
data, real USCIS error conditions, or real service-hours behavior until we move to production
credentials.

**Expected volume:** [INSERT — e.g. current registered user count, expected case-status lookups/day
or /month]. Each lookup is a single, user-initiated, one-receipt-number request — there is no
polling, batch lookup, or background refresh.

## 4. Security and data handling

- **User authentication required.** The case-status endpoint requires a valid Supabase-issued JWT
  (`Authorization: Bearer <token>`); anonymous/unauthenticated callers get a 401 before anything is
  sent to USCIS.
- **Credentials never reach the browser.** The USCIS `client_id`/`client_secret` are stored as
  server-side environment secrets in our Supabase Edge Function runtime and are never sent to, or
  reachable from, client code.
- **Encrypted in transit.** All calls (client ↔ our backend, our backend ↔ USCIS) are HTTPS/TLS.
- **Receipt numbers treated as PII.** Per our published Privacy Policy, USCIS receipt numbers,
  A-Numbers, and USCIS Online Account Numbers are handled as personally identifiable information,
  used only for case tracking/document association, and are never sold to third parties.
- **No bulk/automated querying.** Lookups are 1:1 with a user clicking "check status" on their own
  case; there is no scheduled job or script that iterates receipt numbers.
- **Minimal footprint.** We store the receipt number the user provides (to associate it with their
  case in our system) and the USCIS response needed to show them status; we do not persist or log
  USCIS credentials or tokens beyond the in-memory cache described above.

## 5. Office locator — a caveat we want to be transparent about

Our current "find nearby USCIS office" feature calls a public-facing USCIS web endpoint
(`egov.uscis.gov/office-locator/office-search`) rather than a documented, credentialed USCIS
developer API — because we are not aware of one. If that call fails for any reason, we fall back to
a small, hand-curated, hardcoded list of ~19 well-known USCIS field offices/ASCs/embassies with
distance sorting, so users always get a usable result.

We are flagging this explicitly because it is **not** the same kind of integration as the Case
Status API (no OAuth, no client credentials, no formal "production" tier that we're aware of). If
USCIS has an official, documented locator API we should be using instead, we'd like guidance on how
to request access to it; otherwise we'd appreciate confirmation that calling the public endpoint
directly (with reasonable, non-bulk request volume) is acceptable, or a recommendation on how to
proceed.

## 6. What we're asking USCIS to approve

1. Production `client_id`/`client_secret` for the Case Status API (`api-int.uscis.gov` →
   production host), replacing our current sandbox `demo_id: 3879` credentials.
2. Guidance on the correct/authorized way to source USCIS office-location data, per §5.

---

*This document was prepared from the current D.O.M.E. codebase (see `supabase/functions/uscis-case-status/`
and `supabase/functions/uscis-locator/`) and the platform's published Privacy Policy. Bracketed
`[INSERT ...]` fields need to be filled in with company/contact/volume specifics before submission.*
