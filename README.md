# billgernert.com

[![site-ci](https://github.com/billgernert/billgernert-site/actions/workflows/site-ci.yml/badge.svg)](https://github.com/billgernert/billgernert-site/actions/workflows/site-ci.yml)

This repository is the public deployment mirror for [billgernert.com](https://billgernert.com), a
portfolio about platform and infrastructure engineering across automation, recovery, identity, and
observability.

## Publication boundary

Mapped site content is authored and reviewed in its source repository. The publication pipeline
assembles a fresh staging tree, injects approved generated evidence, applies a fail-closed public-data
scan, and then updates this repository. The public-data contract is documented in
[SANITIZATION.md](SANITIZATION.md).

The synchronized pages, assets, redirects, headers, and sitemap should not be edited here because the
next publication replaces them. Public-only repository files such as this README, [DEPLOY.md](DEPLOY.md),
and `.github/` are maintained through pull requests in this repository.

## Verification

GitHub Actions validates the HTML and internal link graph on pushes and pull requests. Cloudflare
Workers Builds publishes the approved static assets from `main`. The resulting commit exposes both
sets of checks in GitHub before a publication is treated as verified.
