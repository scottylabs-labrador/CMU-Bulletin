/**
 * Helpers for the optional off-site link on a poster.
 *
 * Only http(s) links are allowed so a poster can never carry something like
 * `javascript:` into an <a href>.
 */

/**
 * Returns:
 *  - ''     when the input is empty (the field is optional)
 *  - string a cleaned-up absolute http(s) URL (scheme added if the user omitted it)
 *  - null   when the input is not a usable web link
 */
export function normalizeExternalUrl(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return '';

  let candidate = value;
  if (!/^https?:\/\//i.test(candidate)) {
    // Reject other schemes (javascript:, mailto:, ftp:, ...) but allow "host:8080/path".
    if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(candidate)) return null;
    candidate = `https://${candidate.replace(/^\/\//, '')}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/** "https://www.example.com/a/b" -> "example.com" */
export function getUrlHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}
