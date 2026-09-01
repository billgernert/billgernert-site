# Deployment

This repository is the deployment mirror for `billgernert.com`. Cloudflare Workers Builds is connected
to `billgernert/billgernert-site` on the `main` branch and serves the approved static assets as a
Cloudflare Worker. There is no application server or manual production upload from a workstation.

## Publication flow

1. The reviewed source pipeline builds a fresh mirror of the declared site paths.
2. Generated public evidence is injected before the final validation pass.
3. The exact staged bytes pass the public-data scrub and site checks before any push occurs.
4. The pipeline updates `main` in this repository.
5. The push starts GitHub Actions and Cloudflare Workers Builds. These checks are independent and must
   both complete successfully before the publication is considered verified.

Sync-managed pages and assets must be changed in their source repository. The next publication replaces
those paths here. `README.md`, `DEPLOY.md`, `LICENSE`, and `.github/` are public-only repository files and
are changed through pull requests here.

## Cloudflare configuration record

- Repository: `billgernert/billgernert-site`
- Production branch: `main`
- Static assets directory: repository root
- Asset boundary: `.assetsignore` denies the repository by default and allows only declared website paths
- Response controls: `_headers` and `_redirects`
- Custom domain: `billgernert.com`
- Access boundary: the public apex is outside Cloudflare Access; protected application subdomains keep
  their own Access policies

## Verify a publication

The GitHub commit should show successful checks for Cloudflare Workers Builds, HTML validation, and the
internal link check. Then verify that `https://billgernert.com/` serves the expected commit's content and
security headers. A failed or missing check is not a successful publication.
