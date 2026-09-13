import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.NEWSROOM_TEST_EMAIL,
  password = process.env.NEWSROOM_TEST_PASSWORD;
if (!url || !key || !email || !password)
  throw new Error(
    "Provide database variables and NEWSROOM_TEST_EMAIL / NEWSROOM_TEST_PASSWORD. Values are never logged.",
  );
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = createClient(url, key, options),
  admin = createClient(url, key, options);
const { error: loginError } = await admin.auth.signInWithPassword({
  email,
  password,
});
assert.equal(loginError, null, "Test admin sign-in");
assert.equal((await admin.rpc("is_admin")).data, true, "Admin membership");
const run = randomUUID(),
  slug = `verification-canary-${run}`;
const payload = {
  slug,
  headline: `Synthetic verification canary ${run}`,
  summary: "Synthetic verification content; not an actual news report.",
  body: "Synthetic, temporary verification content. This record tests publication and privacy boundaries and is removed from public access at the end of the test.",
  category: "models",
  status: "draft",
  verification_status: "source_confirmed",
  sources: [
    {
      source_name: "Synthetic primary",
      source_url: `https://example.org/${run}`,
      source_type: "announcement",
      primary_source: true,
    },
  ],
  what_changed: ["Synthetic publication state changed."],
  internal_notes: `PRIVATE-CANARY-${run}`,
  event_key: `verification-${run}`,
};
let id;
try {
  const created = await admin.rpc("save_story", { payload });
  assert.equal(created.error, null, "Transactional story creation");
  id = created.data;
  assert.deepEqual(
    (await anon.from("stories").select("*").eq("id", id)).data,
    [],
    "Draft hidden",
  );
  assert.deepEqual(
    (await anon.from("sources").select("*").eq("story_id", id)).data,
    [],
    "Draft sources hidden",
  );
  for (const table of [
    "story_editorial",
    "ingestion_submissions",
    "audit_logs",
  ]) {
    const r = await anon.from(table).select("*").limit(1);
    assert.ok(r.error || r.data?.length === 0, `${table} private`);
  }
  const write = await anon
    .from("stories")
    .update({ headline: "Unauthorized replacement" })
    .eq("id", id)
    .select();
  assert.ok(write.error || write.data.length === 0, "Public writes denied");
  assert.ok(
    (await anon.rpc("save_story", { payload })).error,
    "Admin RPC denied to anonymous user",
  );
  const invalid = await admin.rpc("save_story", {
    payload: { ...payload, status: "published", sources: [] },
    target_id: id,
  });
  assert.ok(invalid.error, "Database blocks source-free publication");
  assert.equal(
    (await admin.from("stories").select("status").eq("id", id).single()).data
      .status,
    "draft",
    "Failed transaction rolls back",
  );
  const published = await admin.rpc("save_story", {
    payload: { ...payload, status: "published" },
    target_id: id,
  });
  assert.equal(published.error, null, "Publish succeeds");
  const visible = await anon.from("stories").select("*").eq("id", id).single();
  assert.equal(visible.error, null, "Published row visible");
  assert.ok(
    !JSON.stringify(visible.data).includes("PRIVATE-CANARY"),
    "No private field in public row",
  );
  assert.equal(
    (await anon.from("sources").select("*").eq("story_id", id)).data.length,
    1,
    "Published source visible",
  );
  if (process.env.NEWSROOM_BASE_URL) {
    const res = await fetch(`${process.env.NEWSROOM_BASE_URL}/stories/${slug}`);
    const html = await res.text();
    assert.equal(res.status, 200, "Published page live without redeploy");
    assert.ok(
      html.includes(payload.headline),
      "Live page uses new database content",
    );
    assert.ok(
      !html.includes(`PRIVATE-CANARY-${run}`),
      "Private notes absent from SSR and RSC",
    );
  }
  const scheduled = await admin.rpc("save_story", {
    payload: {
      ...payload,
      status: "published",
      published_at: "2099-01-01T00:00:00Z",
    },
    target_id: id,
  });
  assert.equal(scheduled.error, null);
  assert.deepEqual(
    (await anon.from("stories").select("id").eq("id", id)).data,
    [],
    "Future publication hidden",
  );
  console.log(
    "PASS: admin Auth, RLS, anonymous write denial, protected RPCs, transactional rollback, source visibility, immediate publishing, private SSR fields, scheduled visibility.",
  );
  if (process.env.NEWSROOM_BASE_URL && process.env.INGESTION_API_KEY) {
    const endpoint = `${process.env.NEWSROOM_BASE_URL}/api/ingest`;
    assert.equal(
      (
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      401,
      "API denies missing token",
    );
    const request = {
      idempotency_key: `verification-${run}`,
      agent_name: "Integration verification",
      story: {
        ...payload,
        slug: `agent-canary-${run}`,
        headline: `Agent diagnostic ${randomUUID()}`,
        event_key: `agent-verification-${run}`,
        sources: [
          { ...payload.sources[0], source_url: `https://example.net/${run}` },
        ],
        status: "published",
      },
    };
    const send = (body) =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INGESTION_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
    const response = await send(request);
    const first = await response.json();
    assert.equal(response.status, 201, JSON.stringify(first));
    assert.equal(first.status, "review");
    assert.equal(
      (await anon.from("stories").select("id").eq("id", first.story_id)).data
        .length,
      0,
      "Agent draft private",
    );
    const replay = await send(request);
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).replayed, true);
    assert.equal(
      (await send({ ...request, agent_name: "Changed agent" })).status,
      409,
      "Idempotency conflict",
    );
    const duplicate = await send({
      ...request,
      idempotency_key: `duplicate-${run}`,
    });
    const dup = await duplicate.json();
    assert.equal(dup.status, "duplicate");
    assert.equal(dup.story_id, null);
    const rejected = await admin.rpc("review_submission", {
      submission_id: first.submission_id,
      decision: "reject",
    });
    assert.equal(rejected.error, null);
    await admin.rpc("review_submission", {
      submission_id: dup.submission_id,
      decision: "archive",
    });
    console.log(
      "PASS: HTTP authentication, agent review default, private proposal, idempotent replay, conflicting retry, event deduplication, editorial rejection.",
    );
  }
} finally {
  if (id) {
    const { error } = await admin.from("stories").delete().eq("id", id);
    if (error)
      throw new Error(
        "Verification canary cleanup failed; inspect the newsroom.",
      );
  }
  await admin.auth.signOut();
}
