/** The optional Grafana discovery request must be denied, including during rendering. */
export function isExpectedPublicNocDenial(url, method, status) {
  return status === 403 && method === "GET" &&
    url.origin === "https://status.billgernert.com" &&
    url.pathname === "/apis/dashboard.grafana.app/" && url.search === "";
}
