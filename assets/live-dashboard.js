(function () {
  "use strict";

  // `/fleet/` used to be a permanent redirect to `/claude-code/`. Browsers that cached that old
  // redirect must return through the concrete file once; replaceState then exposes the canonical
  // provider-neutral URL without requesting the cached `/fleet/` route again.
  if (window.location.pathname === "/fleet/legacy") {
    window.history.replaceState(null, "", "/fleet/" + window.location.search + window.location.hash);
  }

  var roots = document.querySelectorAll("[data-public-noc]");
  if (!roots.length) {
    return;
  }

  var HEALTH_CHECK_INTERVAL_MS = 8000;
  var BADGE_TICK_INTERVAL_MS = 1000;
  var STATUS_ORIGIN = "https://status.billgernert.com";
  var routeIsLive = false;
  var lastStateAt = Date.now();
  var checking = false;
  var connections = [];

  function prepareFrame(frame) {
    frame.setAttribute("scrolling", "yes");
    return {
      hide: function () {
        frame.hidden = true;
      },
      show: function () {
        frame.hidden = false;
      }
    };
  }

  function updateBadges() {
    var elapsed = Math.max(0, Date.now() - lastStateAt);
    Array.prototype.forEach.call(connections, function (connection) {
      if (!connection.badge) {
        return;
      }
      if (routeIsLive) {
        connection.badge.textContent = "Live, checked " + Math.floor(elapsed / 1000) + "s ago";
        connection.badge.classList.add("is-live");
        connection.badge.classList.remove("is-stale");
      } else {
        connection.badge.textContent = "Last state from " + Math.floor(elapsed / 60000) + " minutes ago";
        connection.badge.classList.add("is-stale");
        connection.badge.classList.remove("is-live");
      }
    });
  }

  function connect(root) {
    var frame = root.querySelector("[data-live-frame]");
    var fallback = root.querySelector("[data-live-fallback]");
    var status = root.querySelector("[data-live-status]");
    var badge = root.querySelector("[data-live-badge]");
    var home = root.querySelector("[data-live-home]");
    var display = prepareFrame(frame);
    var connection = {
      badge: badge,
      fallback: fallback,
      frame: frame,
      loaded: false,
      status: status
    };
    connections.push(connection);

    function showFallback() {
      display.hide();
      frame.removeAttribute("src");
      fallback.hidden = false;
      status.textContent = "Live dashboard unavailable. The explanatory summary remains available.";
    }

    function loadFrame() {
      if (frame.getAttribute("src")) {
        return;
      }
      frame.addEventListener("load", function () {
        connection.loaded = true;
        fallback.hidden = true;
        status.textContent = "Live dashboard connected.";
      }, { once: true });
      display.show();
      frame.src = frame.getAttribute("data-src");
    }

    if (home) {
      home.addEventListener("click", function (event) {
        event.preventDefault();
        display.show();
        fallback.hidden = true;
        status.textContent = "Returning to the live dashboard.";
        loadFrame();
      });
    }

    return {
      connection: connection,
      loadFrame: loadFrame,
      showFallback: showFallback
    };
  }

  var controls = Array.prototype.map.call(roots, function (root) {
    return connect(root);
  });

  function checkHealth() {
    if (checking) {
      return;
    }
    checking = true;
    var controller = new AbortController();
    var timeout = window.setTimeout(function () {
      controller.abort();
    }, HEALTH_CHECK_INTERVAL_MS);

    fetch(STATUS_ORIGIN + "/healthz", {
      cache: "no-store",
      credentials: "omit",
      mode: "cors",
      signal: controller.signal
    }).then(function (response) {
      if (!response.ok || response.headers.get("X-Public-NOC-Status") !== "live") {
        throw new Error("public NOC health contract was not satisfied");
      }

      routeIsLive = true;
      lastStateAt = Date.now();
      Array.prototype.forEach.call(controls, function (control) {
        control.loadFrame();
      });
    }).catch(function () {
      routeIsLive = false;
      Array.prototype.forEach.call(controls, function (control) {
        if (!control.connection.loaded) {
          control.showFallback();
        } else {
          control.connection.status.textContent =
            "Live route not confirmed. Showing the last dashboard state received.";
        }
      });
    }).finally(function () {
      checking = false;
      window.clearTimeout(timeout);
      updateBadges();
    });
  }

  checkHealth();
  window.setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
  window.setInterval(updateBadges, BADGE_TICK_INTERVAL_MS);
}());
