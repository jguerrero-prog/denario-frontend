import { useState, useEffect } from 'react';
import { api } from '../api/client';

// Two independent things mount their own copy of this hook for the same
// file (the conversation-panel result card and the full-page view), and
// React 18 StrictMode double-invokes effects in dev — so a single
// navigation can fire several near-simultaneous HEAD requests for the
// identical URL. Through Docker Desktop's port-forwarding proxy on macOS
// that burst of concurrent connections has been observed to make some of
// them fail (surfacing in the browser as a misleading CORS error, since
// Chrome reports many low-level connection failures that way). Dedup by
// URL so concurrent mounts share one in-flight request instead of each
// opening their own.
const inFlight = new Map<string, Promise<boolean>>();

function checkAvailability(url: string): Promise<boolean> {
  const cached = inFlight.get(url);
  if (cached) return cached;
  const promise = fetch(url, { method: 'HEAD' })
    .then(res => res.ok)
    .catch(() => false);
  inFlight.set(url, promise);
  // Don't cache failures — a transient hiccup shouldn't permanently hide a
  // file that's genuinely there; a later mount gets to try again. Success
  // stays cached forever, which is safe: the URL is generation-specific
  // (see cacheBust below), so a "yes" now will always still be a "yes".
  promise.then(ok => { if (!ok) inFlight.delete(url); });
  return promise;
}

// Real PDF compilation only happens when the backend actually has a LaTeX
// toolchain available (see docker/Dockerfile.api) — on a machine without one,
// manuscript.pdf simply never gets created (denario/paper_agents/latex.py
// gracefully skips compilation rather than erroring). Rather than assume
// either way, check for the real file with a HEAD request and let the UI
// degrade honestly when it's genuinely not there.
// cacheBust should be a per-run value (e.g. result.generatedAt) so a
// regenerate re-checks the real file instead of reusing a stale answer from
// a previous run of the same project/file name.
export function usePdfAvailability(backendProjectId: string | null | undefined, fileName = 'manuscript.pdf', cacheBust?: number) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!backendProjectId) {
      setAvailable(null);
      return;
    }
    let cancelled = false;
    setAvailable(null);
    checkAvailability(api.fileUrl(backendProjectId, fileName, cacheBust))
      .then(ok => { if (!cancelled) setAvailable(ok); });
    return () => { cancelled = true; };
  }, [backendProjectId, fileName, cacheBust]);

  return available;
}
