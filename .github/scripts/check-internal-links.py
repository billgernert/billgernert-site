#!/usr/bin/env python3
"""Internal-link checker for the public billgernert.com site (item 77 second-CI).

Read-only, offline, standard library only. Walks the given root, parses every .html, and for each
internal reference verifies the target resolves inside the repo:
  - relative href/src to a file (optionally with a #fragment): the file must exist, and if a
    fragment is given, an element with that id must exist in the target file;
  - a same-page #fragment: an element with that id must exist in this file.
External links (http, https, protocol-relative //, mailto:, tel:, data:) and empty/JS hrefs are
skipped - deployment and external availability are not this check's job (Cloudflare Pages owns
deploy; no network is touched). Exits non-zero and prints one line per broken link if any fail.

Usage: python3 check-internal-links.py [ROOT]   (ROOT defaults to the current directory)
"""
import os
import re
import sys
import html.parser
import urllib.parse

REF_ATTRS = {"href", "src"}
EXTERNAL_PREFIXES = ("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:")
REDIRECT_STATUSES = {"301", "302", "303", "307", "308"}
MAX_REDIRECT_HOPS = 32
PERCENT_ESCAPE = re.compile(r"%[0-9A-Fa-f]{2}")
BAD_PERCENT_ESCAPE = re.compile(r"%(?![0-9A-Fa-f]{2})")


class Extractor(html.parser.HTMLParser):
    """Collect (attr-name, value) references and the set of element ids on the page."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []   # list of reference strings from href/src
        self.ids = set()  # element ids present in this file (for fragment resolution)

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if value is None:
                continue
            if name in REF_ATTRS:
                self.refs.append(value.strip())
            if name == "id":
                self.ids.add(value.strip())
            if name == "name" and tag == "a":  # legacy anchor targets
                self.ids.add(value.strip())


def parse_html(path):
    ex = Extractor()
    with open(path, encoding="utf-8", errors="replace") as fh:
        ex.feed(fh.read())
    return ex.refs, ex.ids


def _redirect_route(value, line_number, field, errors, allow_wildcard=False, allow_splat=False):
    """Return a decoded, site-root route or record why the redirect field is unsafe."""
    label = f"_redirects:{line_number}: {field}"
    if not value.startswith("/") or value.startswith("//"):
        errors.append(f"{label} must be a site-root path: '{value}'")
        return None
    if "?" in value or "#" in value or "\\" in value:
        errors.append(f"{label} contains query, fragment, or backslash syntax: '{value}'")
        return None
    if BAD_PERCENT_ESCAPE.search(value):
        errors.append(f"{label} contains an invalid percent escape: '{value}'")
        return None
    try:
        decoded = urllib.parse.unquote(value, encoding="utf-8", errors="strict")
    except UnicodeDecodeError:
        errors.append(f"{label} is not valid percent-encoded UTF-8: '{value}'")
        return None
    if PERCENT_ESCAPE.search(decoded):
        errors.append(f"{label} is multiply URL-encoded: '{value}'")
        return None
    if (not decoded.startswith("/") or decoded.startswith("//") or "?" in decoded
            or "#" in decoded or "\\" in decoded
            or any(ord(char) < 32 or ord(char) == 127 for char in decoded)):
        errors.append(f"{label} decodes to an unsafe site-root path: '{value}'")
        return None
    if "*" in decoded:
        if not allow_wildcard or decoded.count("*") != 1 or not decoded.endswith("/*"):
            errors.append(f"{label} wildcard must be one trailing '/*': '{value}'")
            return None
    if ":splat" in decoded:
        if not allow_splat or decoded.count(":splat") != 1 or not decoded.endswith("/:splat"):
            errors.append(f"{label} splat must be one trailing '/:splat' paired with a wildcard source: '{value}'")
            return None
    if any(part in (".", "..") for part in decoded.replace("*", "wildcard").replace(":splat", "splat").split("/")):
        errors.append(f"{label} contains path traversal: '{value}'")
        return None
    return decoded


def _redirect_target(value, line_number, errors, allow_splat=False):
    """Accept a safe site-root route or an HTTPS terminal redirect target."""
    if not value.startswith("https://"):
        return _redirect_route(value, line_number, "target", errors, allow_splat=allow_splat)
    label = f"_redirects:{line_number}: target"
    parsed = urllib.parse.urlsplit(value)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password
            or parsed.fragment or "\\" in value
            or any(ord(char) < 32 or ord(char) == 127 for char in value)):
        errors.append(f"{label} is not a safe HTTPS URL: '{value}'")
        return None
    return value


def _is_external_redirect(value):
    return value.startswith("https://")


def _redirect_target_file(root, route):
    """Resolve a validated site-root route to a file without escaping root."""
    if "*" in route or ":splat" in route:
        return None, f"unresolved redirect pattern: '{route}'"
    candidate = os.path.abspath(os.path.join(root, route.lstrip("/")))
    if route.endswith("/") or os.path.isdir(candidate):
        candidate = os.path.join(candidate, "index.html")
    elif not os.path.isfile(candidate) and os.path.isfile(candidate + ".html"):
        # Cloudflare Pages clean URLs serve /name from the committed name.html document.
        candidate += ".html"
    root_real = os.path.realpath(root)
    candidate_real = os.path.realpath(candidate)
    try:
        inside_root = os.path.commonpath((root_real, candidate_real)) == root_real
    except ValueError:
        inside_root = False
    if not inside_root:
        return None, f"path escapes the selected site root: '{route}'"
    if not os.path.isfile(candidate_real):
        relative = os.path.relpath(candidate, root).replace(os.sep, "/")
        return None, f"no committed file {relative}"
    return candidate_real, None


def _matching_redirect(route, redirects):
    """Return the exact or longest-prefix Cloudflare redirect rule for one concrete route."""
    exact = redirects.get(route)
    if exact is not None:
        return exact
    wildcard_sources = sorted(
        (source for source in redirects if source.endswith("/*")),
        key=len,
        reverse=True,
    )
    for source in wildcard_sources:
        prefix = source[:-1]
        if not route.startswith(prefix):
            continue
        target, status, line_number = redirects[source]
        splat = route[len(prefix):]
        return target.replace(":splat", splat), status, line_number
    return None


def _follow_redirect(route, redirects):
    """Follow an exact redirect route through a bounded, cycle-free chain."""
    seen = []
    current = route
    while True:
        rule = _matching_redirect(current, redirects)
        if rule is None:
            return current, None
        if current in seen:
            cycle = seen[seen.index(current):] + [current]
            return None, "redirect cycle: " + " -> ".join(cycle)
        if len(seen) >= MAX_REDIRECT_HOPS:
            return None, f"redirect chain exceeds {MAX_REDIRECT_HOPS} hops from '{route}'"
        seen.append(current)
        current = rule[0]


def load_redirects(root):
    """Parse and fully validate ROOT/_redirects. Identical duplicate rules are harmless."""
    path = os.path.join(root, "_redirects")
    redirects = {}
    errors = []
    if not os.path.exists(path):
        return redirects, errors
    if not os.path.isfile(path):
        return redirects, ["_redirects: expected a regular file"]

    with open(path, encoding="utf-8", errors="strict") as fh:
        for line_number, raw_line in enumerate(fh, 1):
            stripped = raw_line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            fields = stripped.split()
            if len(fields) != 3:
                errors.append(
                    f"_redirects:{line_number}: expected SOURCE TARGET STATUS, got {len(fields)} field(s)"
                )
                continue
            source_raw, target_raw, status = fields
            source = _redirect_route(source_raw, line_number, "source", errors, allow_wildcard=True)
            target = _redirect_target(
                target_raw,
                line_number,
                errors,
                allow_splat=source is not None and source.endswith("/*"),
            )
            if status not in REDIRECT_STATUSES:
                errors.append(f"_redirects:{line_number}: unsupported redirect status '{status}'")
            if source is None or target is None or status not in REDIRECT_STATUSES:
                continue
            rule = (target, status, line_number)
            if source in redirects:
                previous = redirects[source]
                if previous[:2] != rule[:2]:
                    errors.append(
                        f"_redirects:{line_number}: conflicting duplicate source '{source}' "
                        f"(first declared on line {previous[2]})"
                    )
                continue
            redirects[source] = rule

    probe = "__redirect_probe__"
    for source in sorted(redirects):
        start_route = source[:-1] + probe if source.endswith("/*") else source
        final_route, chain_error = _follow_redirect(start_route, redirects)
        if chain_error:
            errors.append(f"_redirects:{redirects[source][2]}: {chain_error}")
            continue
        if _is_external_redirect(final_route):
            continue
        validation_route = final_route
        if probe in validation_route:
            if validation_route.count(probe) != 1 or not validation_route.endswith(probe):
                errors.append(
                    f"_redirects:{redirects[source][2]}: wildcard source '{source}' does not preserve "
                    "its splat as the final target path segment"
                )
                continue
            validation_route = validation_route[:-len(probe)]
        _, file_error = _redirect_target_file(root, validation_route)
        if file_error:
            errors.append(
                f"_redirects:{redirects[source][2]}: source '{source}' resolves to "
                f"'{validation_route}': {file_error}"
            )
    return redirects, errors


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
    redirects, redirect_errors = load_redirects(root)
    if redirect_errors:
        sys.stderr.write("INVALID REDIRECTS:\n")
        for error in redirect_errors:
            sys.stderr.write(f"  {error}\n")
        sys.stderr.write(f"{len(redirect_errors)} invalid redirect rule error(s).\n")
        sys.exit(1)

    html_files = []
    for dirpath, _, files in os.walk(root):
        # skip VCS / CI internals
        if os.sep + ".git" in dirpath or os.sep + ".github" in dirpath:
            continue
        for fn in files:
            if fn.lower().endswith(".html"):
                html_files.append(os.path.join(dirpath, fn))

    # ids per file, parsed once
    page = {}   # abspath -> (refs, ids)
    for p in html_files:
        page[p] = parse_html(p)

    broken = []
    checked = 0
    for p in sorted(html_files):
        refs, ids = page[p]
        base = os.path.dirname(p)
        rel_self = os.path.relpath(p, root)
        for ref in refs:
            if ref.lower().startswith(EXTERNAL_PREFIXES) or not ref:
                continue
            if ref.startswith("#"):
                # same-page fragment
                frag = urllib.parse.unquote(ref[1:])
                checked += 1
                if frag and frag not in ids:
                    broken.append(f"{rel_self}: missing in-page anchor '#{frag}'")
                continue
            # relative or root-absolute path, possibly path#fragment or path?query
            parsed = urllib.parse.urlparse(ref)
            target_path = urllib.parse.unquote(parsed.path)
            if not target_path:
                continue
            # A leading "/" is site-root-absolute (resolve from the repo root, as the web server
            # does), otherwise resolve relative to this file's directory.
            if target_path.startswith("/"):
                abs_target = os.path.normpath(os.path.join(root, target_path.lstrip("/")))
            else:
                abs_target = os.path.normpath(os.path.join(base, target_path))
            # A directory link (trailing slash, or a real directory) serves its index.html.
            if target_path.endswith("/") or os.path.isdir(abs_target):
                abs_target = os.path.join(abs_target, "index.html")
            elif not os.path.exists(abs_target) and os.path.isfile(abs_target + ".html"):
                abs_target += ".html"
            checked += 1
            if not os.path.exists(abs_target):
                redirect_source = target_path if target_path.startswith("/") else None
                if redirect_source is not None and _matching_redirect(redirect_source, redirects) is not None:
                    final_route, chain_error = _follow_redirect(redirect_source, redirects)
                    if not chain_error and _is_external_redirect(final_route):
                        abs_target, file_error = None, None
                    elif not chain_error:
                        abs_target, file_error = _redirect_target_file(root, final_route)
                    else:
                        file_error = chain_error
                    if file_error:
                        broken.append(f"{rel_self}: broken link -> '{ref}' ({file_error})")
                        continue
                else:
                    broken.append(f"{rel_self}: broken link -> '{ref}' (no file {os.path.relpath(abs_target, root)})")
                    continue
            if parsed.fragment and abs_target in page:
                frag = urllib.parse.unquote(parsed.fragment)
                if frag and frag not in page[abs_target][1]:
                    broken.append(f"{rel_self}: '{ref}' -> file OK but missing anchor '#{frag}'")

    print(f"internal-link check: {len(html_files)} HTML file(s), {checked} internal reference(s)")
    if broken:
        sys.stderr.write("BROKEN INTERNAL LINKS:\n")
        for b in broken:
            sys.stderr.write(f"  {b}\n")
        sys.stderr.write(f"{len(broken)} broken internal link(s).\n")
        sys.exit(1)
    print("all internal links resolve")


if __name__ == "__main__":
    main()
