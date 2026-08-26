import { chromium } from "playwright";

const SITE_URL = "https://billgernert.com/noc/";
const HOME_URL = "https://billgernert.com/";
const MAP_URL = "https://billgernert.com/map/";
const MAP_EMBED_URL = "https://billgernert.com/map/embed/";
const STATUS_ORIGIN = "https://status.billgernert.com";
const STATES = /\b(?:HEALTHY|DEGRADED|CRITICAL|NO SIGNAL)\b/;

function frameAncestors(response) {
  const csp = response.headers.get("Content-Security-Policy") || "";
  return csp.split(";").map(part => part.trim()).find(part => part.startsWith("frame-ancestors ")) || "";
}

async function checkSiteFrameHeaders() {
  const embedResponse = await fetch(MAP_EMBED_URL);
  if (!embedResponse.ok || frameAncestors(embedResponse) !== "frame-ancestors 'self'") {
    throw new Error("map embed does not allow same-origin framing");
  }
  if (embedResponse.headers.has("X-Frame-Options")) {
    throw new Error("map embed still sends X-Frame-Options");
  }

  for (const url of [HOME_URL, MAP_URL, SITE_URL]) {
    const response = await fetch(url);
    if (!response.ok || frameAncestors(response) !== "frame-ancestors 'none'") {
      throw new Error(url + " does not deny framing");
    }
    if ((response.headers.get("X-Frame-Options") || "").toUpperCase() !== "DENY") {
      throw new Error(url + " does not send X-Frame-Options: DENY");
    }
  }
}

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

await checkSiteFrameHeaders();
await checkHealthContract();
await checkEmbed();
console.log("public NOC outside health and embed checks passed");
