# The Inference — internal engineering guide

Private commercial source code. The publication is public; this repository, its editorial operations, and all credentials are private. No open-source license is granted.

The Inference is a source-first AI newsroom: fast reporting, concrete **What Changed?** summaries, company/model intelligence, and an authenticated editorial desk. Branding is centralized in `src/lib/brand.ts`; the visual system is documented in `DESIGN.md`.

## Run locally

Requires Node.js 22 or newer and npm. The implementation was installed, built, and browser-tested on Alpine aarch64 inside Termux/proot with Node 24. No Docker, systemd, local PostgreSQL server, or background AI service is required.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The working workspace already has an untracked `.env.local` connected to the live database. On a fresh authorized checkout, create `.env.local` using `.env.example` and obtain values from the project owner. Never commit this file.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public configuration | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public configuration | Publishable key; access remains controlled by RLS |
| `NEXT_PUBLIC_SITE_URL` | Public configuration | Canonical origin, without a trailing slash; HTTPS in production |
| `INGESTION_API_KEY` | Server secret | Random bearer credential, at least 32 characters; its SHA-256 hash must also be registered in `private.ingestion_keys` |

No service-role key is needed by the application, ingestion endpoint, CMS, or public renderer. No model-provider API key is required. Without database configuration, the public UI presents empty states, not fabricated articles; admin and ingestion fail closed.

## Architecture

- Next.js 16.3.5 App Router, React 19.3.0, strict TypeScript, Tailwind CSS 4, and self-hosted Source Serif 4 / Source Sans 3 fonts. Versions are pinned and the lockfile is committed.
- Public routes are dynamic Server Components. Their Supabase client is deliberately cookie-free, including when an administrator visits the public site. Queries use `no-store`; React `cache()` deduplicates within a render, not between requests. Publishing or editing a database row requires no deploy or cache webhook.
- Browser JavaScript is limited to theme switching and interactive editorial forms. Search, pagination, source lists, reporting, and intelligence pages are server-rendered.
- `src/lib/data.ts` owns public queries. Story lists select explicit fields, excluding long bodies; full-text search and relationship filters run in PostgreSQL. Lists use bounded queries and the reporting archive is paginated.
- `src/lib/validation.ts` is the provider-agnostic content contract. `src/lib/ingestion.ts` is server-only authentication, bounded request parsing, validation, and database orchestration.
- `src/app/admin/actions.ts` contains authenticated Server Actions. Every protected page/action checks current Supabase Auth identity and database-backed admin membership. `src/proxy.ts` refreshes the admin session; it is not the sole authorization boundary.
- SQL functions save stories, sources, associations, and review decisions transactionally. Private notes live separately from published reporting. Database constraints independently enforce publication evidence requirements.
- SEO includes per-story metadata, canonical URLs, OpenGraph image, NewsArticle JSON-LD, RSS, robots, and a live sitemap index with 1,000-row shards. Admin/API paths carry `noindex` and private cache headers. Drafts are excluded by database policy, not just by robots.

## Supabase

Organization: **Test**. Project: **The Inference**. Reference: `fydtwavmkidyyfydxkml`. Region: `us-east-1`.

[Project dashboard](https://supabase.com/dashboard/project/fydtwavmkidyyfydxkml)

### Relational schema

| Table | Responsibility |
| --- | --- |
| `stories` | Slug, headline/deck/summary/body, category, status, importance, breaking/featured, changes, verification, attributed hero image, publication/creation/update timestamps, weighted full-text document |
| `sources` | Multiple sources per story; original URL, source/author/type, primary-source flag, source publication time |
| `categories` | Ordered editorial desks, referenced by story category |
| `companies` | Name/slug, description, website/logo, headquarters/founding year, publication status, extensible metadata |
| `models` | Company FK, name/slug, description, release date, known specifications, per-million-token USD pricing/notes, nullable API/open-weight booleans, license, website, publication status, metadata |
| `story_companies`, `story_models` | Many-to-many reporting/entity associations |
| `daily_briefings`, `briefing_stories` | Dated briefing editions and explicitly ordered coverage |
| `entity_events` | Expandable historical timeline: event type/time, description, source, related company/model/story |
| `story_editorial` | Private event identifier and internal editorial notes |
| `ingestion_submissions` | Private proposed payloads, duplicate candidates, idempotency keys, agent provenance, review state |
| `audit_logs` | Append-only mutation metadata and actor/time; no public access |
| `private.admin_members` | Administrator allowlist keyed to `auth.users`, never user-editable metadata |
| `private.ingestion_keys` | Hashed credentials, enabled state, optional expiry |

Unknown data is SQL `NULL`, including booleans and prices. A known zero price stays zero; a known false stays false. Entity events preserve history independently of current model specifications.

### Migrations and generated types

The ordered SQL files under `supabase/migrations` are already applied to the connected project. Their versions match remote migration history. They include foreign keys, unique constraints, full-text/trigram/feed/relationship indexes, RLS, grants, transaction functions, publication guards, and audit triggers. No production articles are embedded in migrations or repository files; the initial sourced reports were inserted into Supabase.

For an authorized schema change, use the pinned CLI against the **hosted** project:

```sh
npx supabase login
npx supabase link --project-ref fydtwavmkidyyfydxkml
npx supabase migration list --linked
npx supabase migration new descriptive_change
# Edit the newly created SQL migration and review it.
npx supabase db push --linked --dry-run
npx supabase db push --linked
npm run db:types
npm run typecheck
```

Do not run `supabase start` in Termux/proot. Do not reapply the initial schema to the already provisioned database. Database passwords and management tokens are operational credentials, not application environment variables. Check the current CLI `--help` before using administrative commands.

### Privacy and authorization

Anonymous users can read only published, due stories/briefings/events and published entities. Sources and join rows require visible parent records. Future-scheduled content is hidden. Authenticated non-admins have the same public read scope and cannot write; admin membership is checked in a private table, never in user-controlled metadata.

Private tables have no anonymous grants. `private.admin_members` and `private.ingestion_keys` intentionally have deny-all RLS and no direct client grants. Privileged functions live in the private schema, fix their search path, and have narrowly granted, explicit guards. Public RPC wrappers use invoker security. The ingestion capability is the exception to user identity: it verifies a hashed server credential and cannot publish.

Admin `farhajmaaz@gmail.com` has been provisioned. Sign in at `/admin/login` with the temporary credential supplied separately, then change it at `/admin/account` before a public launch. The password is not stored in this repository. Additional admins are provisioned through Supabase Auth by the project owner, then their verified Auth user UUID is inserted into `private.admin_members` from the dashboard SQL editor. Signing up or changing user metadata cannot grant admin access.

Supabase's advisor currently flags leaked-password protection as disabled. This is a hosted Auth setting, not a missing RLS policy. Enable it when supported by the selected plan; do not silently upgrade billing. [Password security guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). The two private deny-all tables and unused indexes on the new dataset are intentional informational notices.

## Editorial operations

`/admin` manages stories; `/admin/review` manages agent proposals. The editor supports draft/review/published/archived states, saved-version previews, breaking/featured flags, importance, source management, changes, and entity associations. Save as Draft to unpublish or Archived to remove public coverage while retaining the record. A future UTC publication timestamp schedules visibility.

Source-confirmed publication requires a primary source. Corroborated publication additionally requires at least two source domains; editors must assess their actual independence. These labels describe reviewed evidence, not guarantees that a vendor's claims are correct. HTML is never executed in report bodies; paragraphs and `##` section headings are supported.

Company/model records, daily briefings with ordered stories, and event timelines have dedicated management pages. Draft entities are published separately, so accepting a story does not accidentally disclose another entity draft. Audit history is read-only. Ingested existing entities are never blindly overwritten; verified specification changes go through the entity editor and event timeline.

## Agent ingestion

See [docs/INGESTION.md](docs/INGESTION.md) for the full contract, example, duplicate handling, and credential rotation.

The workflow is: discover → verify sources → identify primary evidence → submit authenticated structured proposal → normalize URLs / find event duplicates → create missing entities without inventing facts → atomically save story, sources and associations → private review → publish/edit/reject/archive.

External agents own discovery and research scheduling. This application intentionally embeds no LLM vendor, search provider, model-specific prompt, crawler, or fabricated source-verification service. It validates structure and enforces editorial gates; a human or approved external research workflow must actually inspect evidence.

## Production deployment

The application is Vercel-compatible, but no hosted frontend deployment is claimed: the connected Vercel account exposed no team at handoff. The private GitHub repository and live Supabase project are provisioned independently.

1. In an authorized Vercel team, import the **private** `farhajmaaz-eng/the-inference` repository. Grant GitHub integration access only as needed. Do not make the repository public.
2. Select Next.js, repository root, Node 24, install `npm ci`, build `npm run build`; leave output directory automatic. Use a commercial-eligible plan. Vercel Hobby is restricted to personal, non-commercial use. [Official plan guidance](https://vercel.com/docs/plans/hobby).
3. Set all four variables above for Production. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin before building; mark `INGESTION_API_KEY` sensitive. Do not copy production credentials to untrusted previews. No service-role key belongs in Vercel.
4. The existing database is already migrated. For a separate authorized staging project, apply the ordered migrations and provision a separate admin and ingestion hash before use.
5. In Supabase Auth, set the production Site URL, restrict allowed redirect URLs to the application origins, disable unsolicited signups if not needed, and enable available password protections. Password login itself uses the authenticated server flow and does not depend on a magic-link callback.
6. Deploy `main`, assign the domain, and allow public access to production while keeping previews protected. Check a story, `/admin/login`, sitemap/RSS, and authenticated ingestion. Keep production secrets out of logs and screenshots.

A deployment is required for code/configuration changes, never for publishing news. Reverting code does not revert database migrations; ship additive, backwards-compatible schema changes before app code and retain backups appropriate to the business's recovery requirements.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
# With npm run dev (or npm start after build) running:
npm run test:e2e
```

Browser tests use `/usr/bin/chromium` automatically when present, or `CHROMIUM_PATH` for an existing compatible browser. No browser download is performed by installation. Supply `NEWSROOM_TEST_EMAIL` and `NEWSROOM_TEST_PASSWORD` as private process environment variables to include admin checks; never put them in source. Screenshots are written under the ignored `.impeccable/review` directory.

For the full live database/HTTP test, provide those same test credentials plus `NEWSROOM_BASE_URL`, then run:

```sh
node --env-file=.env.local scripts/verify-live.mjs
```

This explicitly mutating verification creates uniquely marked synthetic canaries, briefly publishes one to prove live visibility without a deploy, then removes it; agent canaries are rejected/archived with an audit trail. Run against staging or a controlled editorial window, not unannounced on a busy public newsroom. Unit tests require no credentials or database. See [docs/VERIFICATION.md](docs/VERIFICATION.md) for the recorded V1 results.
