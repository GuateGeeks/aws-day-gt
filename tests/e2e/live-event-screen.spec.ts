import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1920, height: 1080 } });

test("public event dashboard fills a 16:9 screen without horizontal overflow", async ({ page }, testInfo) => {
  await page.route("**/getPublicEventVisualization", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ data: {
        generatedAt: "2026-10-10T15:00:00.000Z",
        eventId: "aws-community-day-gt-2026",
        nodes: [
          { id: "p_0123456789abcdef", alias: "Ada", category: "Development", degree: 1 },
          { id: "p_fedcba9876543210", alias: "Nube", category: "Cloud", degree: 1 }
        ],
        edges: [{ id: "e_0123456789abcdef", source: "p_0123456789abcdef", target: "p_fedcba9876543210" }],
        photos: [],
        tracks: [{ id: "ai", label: "AI & Agents", count: 8, percentage: 62 }],
        insights: ["La comunidad ya creó una conexión por QR."],
        metrics: { participants: 2, connections: 1, approvedPhotos: 0, leadingTrack: { id: "ai", label: "AI & Agents" } }
      } })
    });
  });

  await page.goto("/live");
  await expect(page.getByRole("heading", { level: 1, name: "Comunidad en vivo" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Red de conexiones" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Tracks elegidos" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Pulso del evento" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("live-event-screen.png"), fullPage: true });
});
