import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const output = ".impeccable/review";
async function settled(page: Page) {
  await expect(page.locator("h1")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    .toBe(true);
}
test("public reading, search, intelligence and all viewport/theme captures", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir(output, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  expect((await page.goto("/"))?.status()).toBe(200);
  await settled(page);
  await expect(
    page.getByRole("heading", { name: /what changed/i }).first(),
  ).toBeVisible();
  const story = await page
    .locator('main a[href^="/stories/"]')
    .first()
    .getAttribute("href");
  const company = await page
    .locator('main a[href^="/companies/"]')
    .first()
    .getAttribute("href");
  const model = await page
    .locator('main a[href^="/models/"]')
    .first()
    .getAttribute("href");
  expect(story).toBeTruthy();
  expect(company).toBeTruthy();
  expect(model).toBeTruthy();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const device = width === 1440 ? "desktop" : "mobile";
    await page.goto("/");
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((t) => localStorage.setItem("theme", t), theme);
      await page.reload();
      await settled(page);
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      await page.screenshot({
        path: `${output}/${device}${theme === "dark" ? "-dark" : ""}.png`,
        fullPage: true,
        animations: "disabled",
      });
      await page.goto(story!);
      await settled(page);
      await expect(
        page.getByRole("heading", { name: /^Primary sources/ }),
      ).toBeVisible();
      await expect(
        page.locator('script[type="application/ld+json"]'),
      ).toHaveCount(1);
      await page.screenshot({
        path: `${output}/story-${device}-${theme}.png`,
        fullPage: true,
        animations: "disabled",
      });
      await page.goto("/");
    }
  }
  await page
    .getByRole("button", { name: "Switch light or dark theme" })
    .click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.goto("/search");
  await page.getByLabel("Search reporting").fill("OpenAI");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Intelligence matches" }),
  ).toBeVisible();
  await settled(page);
  await page.screenshot({
    path: `${output}/search-mobile.png`,
    fullPage: true,
  });
  for (const [name, path] of [
    ["company", company!],
    ["model", model!],
    ["archive", "/archive"],
    ["briefing", "/briefings"],
  ]) {
    expect((await page.goto(path))?.status()).toBe(200);
    await settled(page);
    await page.screenshot({
      path: `${output}/${name}-mobile.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [name, path] of [
    ["company", company!],
    ["model", model!],
    ["archive", "/archive"],
    ["briefing", "/briefings"],
  ]) {
    await page.goto(path);
    await settled(page);
    await page.screenshot({
      path: `${output}/${name}-desktop.png`,
      fullPage: true,
    });
  }
  await page.goto("/search?q=nonexistent-zzxxqqww");
  await expect(page.getByText("No reports match this view.")).toBeVisible();
  const admin = await page.goto("/admin");
  expect(admin?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect(errors).toEqual([]);
});

test("crawler surfaces and API fail closed", async ({ request }) => {
  for (const path of [
    "/sitemap.xml",
    "/feed.xml",
    "/robots.txt",
    "/opengraph-image",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    if (path === "/sitemap.xml")
      expect(await response.text()).not.toContain("/admin");
  }
  expect((await request.post("/api/ingest", { data: {} })).status()).toBe(401);
});

test("authenticated newsroom sections and editor render", async ({ page }) => {
  test.skip(
    !process.env.NEWSROOM_TEST_EMAIL || !process.env.NEWSROOM_TEST_PASSWORD,
    "Optional admin credentials are supplied via environment only.",
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.NEWSROOM_TEST_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.NEWSROOM_TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await settled(page);
  await page.screenshot({
    path: `${output}/admin-desktop.png`,
    fullPage: true,
  });
  for (const path of [
    "/admin/review",
    "/admin/stories/new",
    "/admin/entities",
    "/admin/briefings",
    "/admin/events",
    "/admin/audit",
    "/admin/account",
  ]) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await settled(page);
  }
  await page.goto("/admin/stories/new");
  await page.screenshot({
    path: `${output}/editor-desktop.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await settled(page);
  await page.screenshot({
    path: `${output}/editor-mobile.png`,
    fullPage: true,
  });
  await page.goto("/admin/review");
  await settled(page);
  await page.screenshot({
    path: `${output}/review-mobile.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("editor creates, previews, publishes, unpublishes and archives a story", async ({ page, request }) => {
  test.skip(!process.env.NEWSROOM_TEST_EMAIL || !process.env.NEWSROOM_TEST_PASSWORD, "Requires private test administrator credentials.");
  const slug = `browser-canary-${randomUUID()}`;
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.NEWSROOM_TEST_EMAIL!);
  await page.getByLabel("Password", { exact: true }).fill(process.env.NEWSROOM_TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/stories/new");
  await page.getByLabel("Headline", { exact: true }).fill("Synthetic browser verification — not a news report");
  await page.locator('[name="slug"]').fill(slug);
  await page.locator('[name="summary"]').fill("Synthetic temporary content used to verify the newsroom publishing interface.");
  await page.locator('[name="body"]').fill("This is synthetic browser verification content, not actual news. It checks the editorial save, preview, publication, unpublication and archive controls. The record is archived after the test.");
  await page.getByLabel("Source name", { exact: true }).fill("Synthetic verification source");
  await page.getByLabel("Public HTTPS URL").fill(`https://example.org/${slug}`);
  await page.getByLabel("Verification state").selectOption("source_confirmed");
  await page.getByRole("button", { name: "Save story", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/stories\/[a-f0-9-]+\?saved=1/);
  const preview = page.getByRole("link", { name: /Preview saved version/ });
  const previewPath = await preview.getAttribute("href");
  expect(previewPath).toBeTruthy();
  const privatePreview = await request.get(previewPath!);
  expect(privatePreview.url()).toContain("/admin/login");
  const previewPage = await page.context().newPage();
  await previewPage.goto(previewPath!);
  await expect(previewPage.getByText(/Editorial preview/)).toBeVisible();
  await previewPage.close();
  const assertPrivate = async () => {
    const response = await request.get(`/stories/${slug}`);
    const html = await response.text();
    // Next.js can stream its not-found UI with HTTP 200 after a loading shell.
    expect([200, 404]).toContain(response.status());
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toContain("Synthetic browser verification");
  };
  try {
    await assertPrivate();
    await page.getByLabel("Editorial status").selectOption("published");
    await page.getByRole("button", { name: "Save story", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("public edition now reflects");
    const live = await request.get(`/stories/${slug}`);
    expect(live.status()).toBe(200);
    expect(await live.text()).toContain("Synthetic browser verification");
    await page.getByLabel("Editorial status").selectOption("draft");
    await page.getByRole("button", { name: "Save story", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("This story is private");
    await assertPrivate();
  } finally {
    await page.getByLabel("Editorial status").selectOption("archived");
    await page.getByRole("button", { name: "Save story", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("This story is private");
  }
});
