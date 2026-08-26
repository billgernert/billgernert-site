import { chromium } from "playwright";

const SITE_URL = "https://billgernert.com/noc/";
const HOME_URL = "https://billgernert.com/";
const STATUS_ORIGIN = "https://status.billgernert.com";
const STATES = /\b(?:HEALTHY|DEGRADED|CRITICAL|NO SIGNAL)\b/;

async function checkHealthContract() {
  const response = await fetch(STATUS_ORIGIN + "/healthz", {
    headers: { "User-Agent": "automationlab-public-noc-outside-check/1.0" }
  });
  if (!response.ok || response.headers.get("X-Public-NOC-Status") !== "live") {
    throw new Error("public NOC health contract failed with HTTP " + response.status);
  }
}

async function checkEmbed() {
  const browser = await chromium.launch({ headless: true });
  const forbidden = [];
  try {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    page.on("response", response => {
      const url = new URL(response.url());
      if (url.origin === STATUS_ORIGIN && response.status() === 403) {
        forbidden.push(url.pathname);
      }
    });

    await page.goto(SITE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    const frameElement = page.locator("iframe[data-live-frame]").first();
    await frameElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(15000);

    if (forbidden.length) {
      throw new Error("status origin returned HTTP 403 for " + forbidden.join(", "));
    }
    const handle = await frameElement.elementHandle();
    const frame = handle && await handle.contentFrame();
    if (!frame) throw new Error("first live frame did not attach");
    const text = await frame.locator("body").innerText({ timeout: 30000 });
    if (!STATES.test(text)) {
      throw new Error("first live frame contained no approved NOC state");
    }

    await page.goto(HOME_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    const mapElement = page.locator("iframe[data-map-frame]");
    await mapElement.scrollIntoViewIfNeeded();
    const mapHandle = await mapElement.elementHandle();
    const mapFrame = mapHandle && await mapHandle.contentFrame();
    if (!mapFrame) throw new Error("live map frame did not attach");
    await mapFrame.locator("#viewport g.node").first().waitFor({ state: "visible", timeout: 60000 });
  } finally {
    await browser.close();
  }
}

await checkHealthContract();
await checkEmbed();
console.log("public NOC outside health and embed checks passed");
