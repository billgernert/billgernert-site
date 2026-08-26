import { chromium } from "playwright";

const MAP_URL = "https://billgernert.com/map/";
const OUTPUT = process.argv[2] || "map/img/topology-map.png";

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(MAP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#viewport g.node").first().waitFor({ state: "visible", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: OUTPUT, fullPage: true, type: "png" });
} finally {
  await browser.close();
}

console.log("captured live topology map at 1280px with en-US locale");
