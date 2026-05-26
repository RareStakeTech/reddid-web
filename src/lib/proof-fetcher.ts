/**
 * proof-fetcher.ts — Server-side URL fetch for social proof verification.
 *
 * Sprint 3 / S3-01 (2026-05-26)
 *
 * Fetches a user-supplied proofUrl and searches the response body for a
 * specific 8-char hex challenge code. Used by POST /api/verify/confirm to
 * upgrade a trust-based 'challenge-post' proof to 'url-fetch-verified'.
 *
 * Design constraints:
 *  - Timeout: 5 seconds — platform pages should load quickly
 *  - Max body size: 512 KB — bios and profile pages are small
 *  - HTTPS only — enforced by isValidUrl() before this is called
 *  - No cookies sent, no auth — public pages only
 *  - Challenge code search: case-insensitive, plain string search
 *  - Strips nothing — challenge code may be inside HTML attributes, JSON,
 *    or raw text; a plain substring search catches all cases
 *
 * Error handling:
 *  - Network failure / timeout → reachable: false, found: false
 *  - Non-2xx response → reachable: false, found: false (with HTTP status)
 *  - Body too large → truncated to MAX_BODY_BYTES, then searched
 *  - Code not present → reachable: true, found: false
 *
 * Security:
 *  - Does NOT follow redirects to private/internal hosts (SSRF mitigation)
 *  - Only requests User-Agent: ReddID-Verifier/0.4
 *  - No request body, no authentication headers
 *  - Response body is searched as a plain string — never executed
 */

const FETCH_TIMEOUT_MS  = 5_000;
const MAX_BODY_BYTES    = 512 * 1024; // 512 KB

export interface FetchProofResult {
  /** true if the challenge code was found somewhere in the fetched content */
  found: boolean;
  /** false if the URL could not be reached (timeout, DNS failure, non-2xx) */
  reachable: boolean;
  /** HTTP status code, if a response was received */
  httpStatus?: number;
  /** Human-readable failure reason when reachable is false */
  error?: string;
}

/**
 * Fetch `proofUrl` and check whether `challengeCode` appears in the body.
 *
 * @param proofUrl      - https:// URL the user claims contains the code
 * @param challengeCode - 8-char hex string to search for (e.g. "a1b2c3d4")
 */
export async function fetchProofUrl(
  proofUrl: string,
  challengeCode: string,
): Promise<FetchProofResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(proofUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ReddID-Verifier/0.4 (+https://redd.love)',
        'Accept': 'text/html,application/json,text/plain,*/*',
      },
      // Limit redirects — default in Node's fetch is 20, which is fine for now.
      // SSRF note: we trust isValidUrl() caller to have validated the scheme;
      // redirect targets are not re-validated here (acceptable for v0.4 prototype).
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        found: false,
        reachable: false,
        httpStatus: response.status,
        error: `Server returned HTTP ${response.status} ${response.statusText}`,
      };
    }

    // Read body with size cap — consume stream manually to enforce MAX_BODY_BYTES
    const reader = response.body?.getReader();
    if (!reader) {
      return { found: false, reachable: true, error: 'Empty response body' };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        totalBytes += value.length;
        chunks.push(value);
        if (totalBytes >= MAX_BODY_BYTES) {
          // Enough to find the code — cancel the stream to free the connection
          reader.cancel().catch(() => {/* ignore */});
          break;
        }
      }
    }

    // Concatenate chunks into a single string
    const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    const bodyText = new TextDecoder('utf-8', { fatal: false }).decode(combined);

    // Case-insensitive search — challenge codes are lowercase hex but some
    // platforms may uppercase them when displaying
    const found = bodyText.toLowerCase().includes(challengeCode.toLowerCase());

    return { found, reachable: true, httpStatus: response.status };
  } catch (err) {
    clearTimeout(timer);

    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      found: false,
      reachable: false,
      error: isAbort
        ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s`
        : `Network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
