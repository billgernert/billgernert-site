(function () {
  "use strict";

  // `/fleet/` used to be a permanent redirect to `/claude-code/`. Browsers that cached that old
  // redirect must return through the concrete file once; replaceState then exposes the canonical
  // provider-neutral URL without requesting the cached `/fleet/` route again.
  if (window.location.pathname === "/fleet/legacy") {
    window.history.replaceState(null, "", "/fleet/" + window.location.search + window.location.hash);
  }

  var root = document.querySelector("[data-public-noc]");
  if (!root) {
    return;
  }

  var frame = root.querySelector("[data-live-frame]");
  var fallback = root.querySelector("[data-live-fallback]");
  var status = root.querySelector("[data-live-status]");
  var home = root.querySelector("[data-live-home]");
  var controller = new AbortController();
  var timeout = window.setTimeout(function () {
    controller.abort();
  }, 8000);

  function showFallback() {
    frame.hidden = true;
    frame.removeAttribute("src");
    fallback.hidden = false;
    status.textContent = "Live dashboard unavailable. Showing the dated capture.";
  }

  if (home) {
    home.addEventListener("click", function (event) {
      event.preventDefault();
      frame.hidden = false;
      frame.src = frame.getAttribute("data-src");
      fallback.hidden = true;
      status.textContent = "Returning to the NOC overview.";
    });
  }

  fetch("https://status.billgernert.com/healthz", {
    cache: "no-store",
    credentials: "omit",
    mode: "cors",
    signal: controller.signal
  }).then(function (response) {
    if (!response.ok || response.headers.get("X-Public-NOC-Status") !== "live") {
      throw new Error("public NOC health contract was not satisfied");
    }

    frame.addEventListener("load", function () {
      window.clearTimeout(timeout);
      fallback.hidden = true;
      status.textContent = "Live dashboard connected.";
    }, { once: true });
    frame.hidden = false;
    frame.src = frame.getAttribute("data-src");
  }).catch(function () {
    window.clearTimeout(timeout);
    showFallback();
  });
}());
