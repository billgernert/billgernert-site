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

async function checkMetadataBoundary() {
  const siteResponse = await fetch(SITE_URL);
  const siteHtml = await siteResponse.text();
  const dashboardMatch = siteHtml.match(
    /https:\/\/status\.billgernert\.com\/public-dashboards\/([0-9a-f]{32})/
  );
  if (!siteResponse.ok || !dashboardMatch) {
    throw new Error("public NOC page has no pinned dashboard URL");
  }

  const dashboardUrl = dashboardMatch[0];
  const dashboardResponse = await fetch(dashboardUrl);
  const dashboardHtml = await dashboardResponse.text();
  if (!dashboardResponse.ok ||
      dashboardResponse.headers.get("X-Public-NOC-Boundary") !== "metadata-v1") {
    throw new Error("public dashboard did not pass through the metadata boundary");
  }
  for (const [name, pattern] of [
    ["private Grafana origin", /grafana\.parsec-lab\.com/i],
    ["private SSO label", /parsec-lab\s+SSO/i],
    ["datasource proxy route", /\/api\/datasources\/proxy\//i],
    ["Grafana software version", /"(?:pluginVersion|versionString)"\s*:\s*"[^"\s]+"/i],
    ["Grafana commit", /"commit(?:Short)?"\s*:\s*"[0-9a-f]{7,40}"/i]
  ]) {
    if (pattern.test(dashboardHtml)) throw new Error("public dashboard exposed " + name);
  }
  if (!/"hideVersion":true/.test(dashboardHtml) || /dashboardNewLayouts|provisioning/.test(dashboardHtml)) {
    throw new Error("public dashboard bootstrap metadata was not reduced");
  }

  const apiUrl = `${STATUS_ORIGIN}/api/public/dashboards/${dashboardMatch[1]}`;
  const apiResponse = await fetch(apiUrl);
  const apiBody = await apiResponse.text();
  if (!apiResponse.ok || apiResponse.headers.get("X-Public-NOC-Boundary") !== "metadata-v1") {
    throw new Error("public dashboard JSON did not pass through the metadata boundary");
  }
  if (/"(?:pluginVersion|folderUid|created|updated)"\s*:/.test(apiBody)) {
    throw new Error("public dashboard JSON exposed implementation metadata");
  }

  const annotationsUrl = `${apiUrl}/annotations?from=0&to=1`;
  const annotationsResponse = await fetch(annotationsUrl);
  const annotationsBody = await annotationsResponse.text();
  let annotations;
  try {
    annotations = JSON.parse(annotationsBody);
  } catch (_) {
    annotations = null;
  }
  if (!annotationsResponse.ok ||
      annotationsResponse.headers.get("X-Public-NOC-Boundary") !== "metadata-v1" ||
      !Array.isArray(annotations) || annotations.length !== 0) {
    throw new Error("public dashboard annotations did not return the closed empty contract");
  }

  const genericApi = await fetch(STATUS_ORIGIN + "/apis/dashboard.grafana.app/", {
    redirect: "manual"
  });
  if (genericApi.status !== 403) {
    throw new Error("generic Grafana dashboard API was not blocked at Access");
  }
}

async function checkEmbed() {
  const browser = await chromium.launch({ headless: true });
  const forbidden = [];
  const responseChecks = [];
  try {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    page.on("response", response => {
      const url = new URL(response.url());
      if (url.origin === STATUS_ORIGIN && response.status() === 403) {
        forbidden.push(url.pathname);
      }
      if (url.origin === STATUS_ORIGIN &&
          url.pathname.startsWith("/api/public/dashboards/") &&
          response.status() === 200) {
        responseChecks.push(response.headerValue("X-Public-NOC-Boundary").then(value => {
          if (value !== "metadata-v1") {
            forbidden.push(url.pathname + " (metadata boundary missing)");
          }
        }));
      }
    });

    await page.goto(SITE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    const frameElement = page.locator("iframe[data-live-frame]").first();
    await frameElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(15000);
    await Promise.all(responseChecks);

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
await checkMetadataBoundary();
await checkEmbed();
console.log("public NOC outside metadata, health, and embed checks passed");
