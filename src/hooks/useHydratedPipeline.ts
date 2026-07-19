import { useState, useEffect } from 'react';
import { usePipelineStore } from '../store/pipelineStore';
import { api } from '../api/client';

// Any page reading pipeline state directly from the store can end up with
// nothing to show — not just on a raw browser refresh, but also mid-session
// when a dev-server hot-reload falls back to a full page reload (e.g. after
// editing a non-component module), which resets the in-memory store. This
// hook detects that (the store's pipeline id doesn't match the URL's real
// project id) and re-fetches automatically, rather than showing a blank page
// until the user navigates elsewhere and back. Originally built inline in
// StagePage.tsx for the refresh case; extracted here so every full-page view
// (Idea/Methods/Paper/Analysis) can share the same fix instead of
// re-implementing it — today only StagePage and AnalysisFullPage use it.
export function useHydratedPipeline(projectId: string | undefined) {
  const pipeline = usePipelineStore(s => s.pipeline);
  const hydratePipeline = usePipelineStore(s => s.hydratePipeline);

  const needsFetch = !!projectId && pipeline?.id !== projectId;
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (!needsFetch || !projectId) return;
    let cancelled = false;
    api.getProject(projectId)
      .then(project => {
        if (!cancelled) hydratePipeline(project);
      })
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      });
    return () => { cancelled = true; };
  }, [needsFetch, projectId, hydratePipeline]);

  return { pipeline, needsFetch, fetchFailed };
}
