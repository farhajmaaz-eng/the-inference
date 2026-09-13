# V1 verification record

Verified September 13, 2026 in Alpine aarch64 under Termux/proot, using Node.js 24 and the installed `/usr/bin/chromium`. No Docker-based tools or downloaded browser binaries were used.

## Automated results

- `npm install`: 423 packages audited, 0 vulnerabilities.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed under strict TypeScript after Next.js route type generation.
- `npm test`: 30/30 Vitest tests passed across validation and ingestion boundaries.
- `npm run build`: passed with Next.js 16.3.5; all public, CMS, ingestion, sitemap, RSS, OpenGraph, and robots routes compiled.
- `npm run test:e2e`: 3/3 public/CMS suites passed, covering the complete public screenshot matrix, search, intelligence pages, structured data, crawler routes, API authentication, and protected admin pages.
- Authenticated editor lifecycle: passed create → private preview → publish → immediately visible → unpublish → private → archive.

## Live Supabase integration

Passed against project `fydtwavmkidyyfydxkml`:

- administrator sign-in and database membership authorization;
- anonymous read/write boundaries and denial of protected RPCs;
- draft sources, private editorial notes, proposals, and audit records hidden from anonymous and non-admin sessions;
- user-controlled metadata cannot grant administrator status;
- invalid source-free publication rolls back atomically;
- publishing is immediately visible through SSR without a code change, cache purge, server restart, or deployment;
- future publication times remain hidden;
- bearer-authenticated ingestion always enters private review;
- exact retry is idempotent, a changed retry conflicts, and a duplicate event produces no second story;
- editorial rejection/archive completes the proposal workflow.

Supabase security advisors report no RLS/function errors. The hosted Auth advisor reports leaked-password protection disabled; enable it from Auth settings when supported by the chosen plan. Performance advisors report only expected unused-index informational notices on the new, very small dataset.

## Visual matrix

The homepage and story reader were inspected at 1440px and 390px in light and dark themes. Company, model, archive, briefing, search, story, login, story desk, AI review, and editor surfaces were inspected across desktop/mobile as applicable. Browser assertions found no page errors or horizontal overflow. The Impeccable detector returned an empty finding set.

Synthetic verification stories are clearly labeled, never production reporting, and end private/archived or are removed from public visibility. Credentials and screenshot artifacts are excluded from Git.
