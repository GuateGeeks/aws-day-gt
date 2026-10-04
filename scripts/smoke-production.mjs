const base = process.argv[2];
if (!base) throw new Error("Usage: node scripts/smoke-production.mjs <hosting-url>");
for (const path of ["/", "/app/missions", "/manifest.webmanifest"]) {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  console.log(`OK ${path} (${response.status})`);
}
