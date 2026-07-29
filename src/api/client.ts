// Typed client for the Denario FastAPI backend.
// Base URL is read from the VITE_API_URL env var; falls back to localhost:8000.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';
const V1   = `${BASE}/api/v1`;

// ── Types mirroring the backend Pydantic models ────────────────────────────────

export type StageStatus = 'locked' | 'idle' | 'running' | 'complete' | 'error';

export interface BackendStageResult {
  stage_id:     string;
  status:       StageStatus;
  file:         string | null;
  title:        string | null;
  content:      string | null;
  structured:   Record<string, unknown> | null;  // schema-constrained data (currently: methods/analysis)
  tags:         string[];
  duration_sec: number | null;
  generated_at: number | null;
  error:        string | null;
  // ROADMAP.md ticket 6.6 — true when an upstream stage's revision has moved
  // past what this stage was actually generated against. Detection only —
  // the UI proposes a refresh, it never auto-triggers one.
  stale:         boolean;
  stale_because: string[];
}

export interface BackendProject {
  id:          string;
  name:        string;
  workspace:   string;
  project_dir: string;
  stages:      Record<string, BackendStageResult>;
  created_at:  number;
  updated_at:  number;
}

export type SseEvent =
  | { type: 'log';      text: string }
  | { type: 'complete'; result: BackendStageResult }
  | { type: 'error';    error: string };

// ROADMAP.md ticket 6.3/6.4 — the compose bar's own event shape, distinct
// from SseEvent's stage-result shape. No live per-tool-call transparency
// for v1 (resolved design) — just one status notice, then complete/error.
export type AssistantProposedAction =
  | { type: 'run'; stage_id: string }
  | { type: 'edit'; stage_id: string; old_content: string; new_content: string; new_structured: Record<string, unknown> | null }
  | { type: 'plot'; stage_id: string; plot_filename: string; old_plot_path: string; new_plot_path: string; description: string };

export type AssistantSseEvent =
  | { type: 'status';   text: string }
  | { type: 'complete'; answer: string; partial: boolean; proposed_action: AssistantProposedAction | null }
  | { type: 'error';    error: string };

// ── Helpers ────────────────────────────────────────────────────────────────────

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${V1}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Project endpoints ──────────────────────────────────────────────────────────

export const api = {
  createProject(name: string, dataDescription: string): Promise<BackendProject> {
    return req('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, data_description: dataDescription }),
    });
  },

  listProjects(): Promise<BackendProject[]> {
    return req('/projects');
  },

  getProject(projectId: string): Promise<BackendProject> {
    return req(`/projects/${projectId}`);
  },

  deleteProject(projectId: string): Promise<{ message: string }> {
    return req(`/projects/${projectId}`, { method: 'DELETE' });
  },

  setInput(projectId: string, dataDescription: string): Promise<BackendProject> {
    return req(`/projects/${projectId}/input`, {
      method: 'POST',
      body: JSON.stringify({ data_description: dataDescription }),
    });
  },

  async uploadFiles(projectId: string, files: File[]): Promise<BackendProject> {
    const formData = new FormData();
    for (const file of files) formData.append('files', file);
    // No Content-Type header here — the browser sets the multipart boundary itself.
    const res = await fetch(`${V1}/projects/${projectId}/files`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`${res.status} /projects/${projectId}/files: ${text}`);
    }
    return res.json() as Promise<BackendProject>;
  },

  // ── Stage endpoints ──────────────────────────────────────────────────────────

  async healthCheck(): Promise<void> {
    const res = await fetch(`${BASE}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`${res.status}`);
  },

  listModels(): Promise<{ models: string[] }> {
    return req('/models');
  },

  runStage(
    projectId: string,
    stageId:   string,
    options: {
      track?:             'fast' | 'cmbagent';
      model_overrides?:   Record<string, string>;
      force_restart?:     boolean;
      journal?:           string;
      writer?:            string;
      add_citations?:     boolean;
      n_keywords?:        number;
      kw_type?:           string;
      openai_api_key?:    string;
      anthropic_api_key?: string;
      google_api_key?:    string;
    } = {},
  ): Promise<{ project_id: string; stage_id: string; status: StageStatus }> {
    const { track, model_overrides, force_restart, journal, writer, add_citations, n_keywords, kw_type, ...apiKeys } = options;
    return req(`/projects/${projectId}/stages/${stageId}/run`, {
      method: 'POST',
      body: JSON.stringify({
        track:           track           ?? 'fast',
        model_overrides: model_overrides ?? {},
        force_restart:   force_restart   ?? false,
        journal:         journal         ?? 'NONE',
        writer:          writer          ?? 'scientist',
        add_citations:   add_citations   ?? true,
        n_keywords:      n_keywords      ?? 5,
        kw_type:         kw_type         ?? 'unesco',
        ...apiKeys,
      }),
    });
  },

  stopStage(projectId: string, stageId: string): Promise<{ message: string }> {
    return req(`/projects/${projectId}/stages/${stageId}/stop`, { method: 'POST' });
  },

  approveStage(
    projectId:        string,
    stageId:          string,
    editedContent?:    string,
    editedStructured?: Record<string, unknown>,
  ): Promise<{ message: string }> {
    return req(`/projects/${projectId}/stages/${stageId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        edited_content:    editedContent    ?? null,
        edited_structured: editedStructured ?? null,
      }),
    });
  },

  getStageResult(projectId: string, stageId: string): Promise<BackendStageResult> {
    return req(`/projects/${projectId}/stages/${stageId}/result`);
  },

  // ROADMAP.md ticket 6.9 — confirms a compose-bar-proposed plot
  // regeneration. Analysis-only, matching approveStage's Methods-only
  // edited_structured scoping (6.5) — a dedicated endpoint rather than
  // overloading approveStage, since a plot isn't a whole-stage approval.
  applyPlotRegeneration(
    projectId:    string,
    plotFilename: string,
    newPlotPath:  string,
  ): Promise<{ message: string }> {
    return req(`/projects/${projectId}/stages/analysis/plots/${encodeURIComponent(plotFilename)}/apply`, {
      method: 'POST',
      body: JSON.stringify({ new_plot_path: newPlotPath }),
    });
  },

  // ── Paper endpoints ──────────────────────────────────────────────────────────

  recompilePaper(projectId: string, texContent: string): Promise<{
    success:           boolean;
    pdf_available:     boolean;
    xelatex_available: boolean;
    errors:            string | null;
    diagnostics:       { line: number | null; message: string }[];
    log:               string | null;
    compiled_at:       number;
  }> {
    return req(`/projects/${projectId}/paper/recompile`, {
      method: 'POST',
      body: JSON.stringify({ tex_content: texContent }),
    });
  },

  autoFixPaper(projectId: string, texContent: string): Promise<{
    success:           boolean;
    pdf_available:     boolean;
    xelatex_available: boolean;
    errors:            string | null;
    diagnostics:       { line: number | null; message: string }[];
    log:               string | null;
    compiled_at:       number;
    fixed_tex:         string;
    attempts:          number;
    fixed:             boolean;
    llm_error:         string | null;
  }> {
    return req(`/projects/${projectId}/paper/auto-fix`, {
      method: 'POST',
      body: JSON.stringify({ tex_content: texContent }),
    });
  },

  // ── File URLs ────────────────────────────────────────────────────────────────

  fileUrl(projectId: string, filePath: string, cacheBust?: number): string {
    const base = `${V1}/projects/${projectId}/files/${filePath}`;
    return cacheBust ? `${base}?t=${cacheBust}` : base;
  },

  // ── SSE stream ───────────────────────────────────────────────────────────────

  streamStage(
    projectId:  string,
    stageId:    string,
    onEvent:    (event: SseEvent) => void,
    onDone:     () => void,
  ): () => void {
    const es = new EventSource(`${V1}/projects/${projectId}/stages/${stageId}/stream`);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SseEvent;
        onEvent(event);
        if (event.type === 'complete' || event.type === 'error') {
          es.close();
          onDone();
        }
      } catch {
        // malformed event — ignore
      }
    };

    es.onerror = () => {
      onEvent({ type: 'error', error: 'Connection to server lost.' });
      es.close();
      onDone();
    };

    // Return a cleanup function the caller can use to close early
    return () => es.close();
  },

  // ── Compose bar (ROADMAP.md 6.3/6.4) ────────────────────────────────────────
  // Two-step, same shape as runStage/streamStage: askAssistant starts the
  // question and returns immediately; streamAssistant consumes the SSE
  // reply. Not yet wired into a UI component — the compose bar's input is
  // still deliberately static scaffolding pending its own scoping decision.

  askAssistant(projectId: string, question: string): Promise<{ status: string }> {
    return req(`/projects/${projectId}/assistant/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },

  streamAssistant(
    projectId: string,
    onEvent:   (event: AssistantSseEvent) => void,
    onDone:    () => void,
  ): () => void {
    const es = new EventSource(`${V1}/projects/${projectId}/assistant/stream`);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as AssistantSseEvent;
        onEvent(event);
        if (event.type === 'complete' || event.type === 'error') {
          es.close();
          onDone();
        }
      } catch {
        // malformed event — ignore
      }
    };

    es.onerror = () => {
      onEvent({ type: 'error', error: 'Connection to server lost.' });
      es.close();
      onDone();
    };

    return () => es.close();
  },
};
