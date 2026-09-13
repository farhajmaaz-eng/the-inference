# Internal agent ingestion contract

Endpoint: `POST /api/ingest`. Runtime: Node.js, server-only. Content type: `application/json`. Authorization: `Bearer <INGESTION_API_KEY>`. Do not send a Supabase service-role key. The publishable key alone grants no ingestion authority.

`StoryInput`, `SourceInput`, `CompanyReference`, `ModelReference`, and `IngestionResult` are exported from `src/lib/validation.ts` and re-exported by the server ingestion module. Zod is the executable contract. Unknown object fields are rejected rather than silently discarded.

## Research responsibilities

Agents must inspect current primary material and any secondary reporting before submission, separate announcement dates from publication dates, retain qualifications, attribute performance/pricing claims, and preserve missing specifications as `null`. Never convert a missing value to zero or false. Do not mark a repost or syndicated story as independent corroboration. Use original reporting, not copied articles. Include image provenance/credit and meaningful alternative text if an image is supplied.

The server does not browse submitted URLs. HTTPS validation is not a claim that a source exists or is trustworthy. URL normalization removes tracking parameters/fragments and normalizes trailing slashes; editors can inspect the stored original-source links.

## Request example

This is a deliberately synthetic example, not publishable news. Replace it with researched reporting; production stories never come from this file.

```json
{
  "idempotency_key": "research-run-unique-event-0001",
  "agent_name": "Research agent / pipeline name",
  "story": {
    "slug": "synthetic-contract-example",
    "headline": "Synthetic example of a source-backed agent proposal",
    "summary": "Synthetic example demonstrating the structure expected by the newsroom ingestion endpoint.",
    "body": "This is synthetic contract documentation, not an actual news report. Replace every factual field with original reporting supported by inspected sources before submitting to the newsroom.",
    "category": "models",
    "status": "review",
    "importance": 3,
    "breaking": false,
    "featured": false,
    "what_changed": ["Describe the specific, evidenced difference from the previous state."],
    "verification_status": "unverified",
    "event_key": "synthetic-stable-event-identifier",
    "sources": [{
      "source_name": "Synthetic primary source",
      "source_url": "https://example.org/original-announcement",
      "author": null,
      "source_type": "announcement",
      "primary_source": true,
      "published_at": null
    }],
    "companies": [],
    "models": [],
    "internal_notes": "Private research caveats and follow-up questions."
  }
}
```

Source types: `announcement`, `paper`, `documentation`, `repository`, `filing`, `reporting`, `other`. Verification states: `unverified`, `source_confirmed`, `corroborated`, `disputed`. Agent stories always enter `review`, including a validated request asking to publish. Sources are mandatory for intake. A request claiming source confirmation needs primary evidence; corroboration needs a primary source and at least two domains. Database publication guards independently recheck those constraints.

Company references use stable `slug` and `name`, with optional nullable `description` and `website`. Model references additionally accept `company_slug`, `release_date`, `model_type`, `context_window`, `input_price_per_million`, `output_price_per_million`, `pricing_notes`, `api_available`, `open_weights`, `website`, and `license`. Include the company in `companies` when creating a model with a new developer. Existing records are reused by slug without overwriting their known metadata. New records remain private drafts until separately approved in the entity editor.

## Transaction and duplicate behavior

After bounded parsing (150,000 bytes, including streamed/chunked requests), Zod validates and normalizes the proposal. PostgreSQL verifies the SHA-256 credential, checks enabled/expiry state, obtains transaction locks, and applies a database-backed limit of 30 new submissions per key per minute. Server authorization is constant-time after hashing.

Duplicate candidates are found by stable event identifier, shared normalized primary-source URL, or headline trigram similarity above 0.55 within seven days. These are editorial suggestions, not an automatic assertion that events are identical. A proposal with candidates is recorded privately without creating another story. Editors can open an existing story from the proposal, incorporate verified new material, and complete the review transactionally. They can also create a separate story when the events are genuinely different.

Successful intake returns:

```ts
interface IngestionResult {
  submission_id: string;
  story_id: string | null;
  status: "review" | "duplicate";
  duplicate_candidates: { id: string; headline: string; reason: string }[];
  replayed: boolean;
}
```

| HTTP status | Meaning / action |
| --- | --- |
| `201` | New private review submission or duplicate proposal accepted |
| `200` | Exact idempotent retry; no additional story or submission |
| `401` | Missing, invalid, expired, or disabled credential |
| `409` | Idempotency key reused with different normalized content, or unique record conflict; inspect before retrying |
| `413` | Request exceeds the bounded body limit |
| `415` | Unsupported content type |
| `422` | Validation or database constraint rejected the proposal; repair the specified fields |
| `429` | Rate limit reached; honor `Retry-After` and back off |

Use a stable idempotency key for network retries. Preserve the same normalized content and agent name. A reviewed retry acknowledges the original submission; it does not reopen or republish it. For a materially new event/update, use a new key but retain the event identifier so the newsroom can merge coverage. Never automatically retry non-idempotent writes after an unknown result.

## Credential provisioning and rotation

The initial workspace credential is already registered. It exists only in untracked `.env.local`; its hash is in the private database table. Share the secret only with approved agent infrastructure through a secret store.

Generate a new cryptographically random 32-byte hexadecimal token in a trusted secret manager or owner-controlled process. Compute its SHA-256 hex digest there. In the Supabase dashboard SQL editor, as owner:

```sql
insert into private.ingestion_keys (name, token_hash, expires_at)
values ('approved-agent-production', '<SHA-256 hex digest, NOT the token>', now() + interval '90 days');
```

Set `INGESTION_API_KEY` in the server's secret environment and the matching agent secret. Redeploy for this environment change. Then disable the exact previous key by its verified UUID:

```sql
update private.ingestion_keys set enabled = false where id = '<previous-key-uuid>';
```

The V1 HTTP endpoint accepts one active environment credential; the database supports multiple registered hashes for rotation/expiry. Database revocation is immediate even if a deployment still holds the old value. Never add these credentials to `NEXT_PUBLIC_*`, report bodies, source URLs, client-side scripts, screenshots, logs, or Git history.
