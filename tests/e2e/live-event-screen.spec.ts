import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1920, height: 1080 } });

test("public event dashboard fills a 16:9 screen without viewport overflow", async ({ page }, testInfo) => {
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
        photos: [{ id: "ph_0123456789abcdef", alias: "Ada", url: "/live-media/ph_0123456789abcdef", width: 750, height: 2000 }],
        tracks: [{ id: "ai", label: "AI & Agents", count: 8, percentage: 62 }],
        insights: ["La comunidad ya creó una conexión por QR."],
        metrics: { participants: 2, connections: 1, approvedPhotos: 0, leadingTrack: { id: "ai", label: "AI & Agents" } }
      } })
    });
  });
  await page.route("**/live-media/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="750" height="2000"><rect width="100%" height="100%" fill="#42ded3"/></svg>'
    });
  });

  await page.goto("/live");
  await expect(page.getByRole("heading", { level: 1, name: "Comunidad en vivo" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Red de conexiones" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Tracks elegidos" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Pulso del evento" })).toBeVisible();
  expect(await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth <= window.innerWidth,
    vertical: document.documentElement.scrollHeight <= window.innerHeight
  }))).toEqual({ horizontal: true, vertical: true });
  await page.screenshot({ path: testInfo.outputPath("live-event-screen.png"), fullPage: true });
});
