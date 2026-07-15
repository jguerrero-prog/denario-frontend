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
  tags:         string[];
  duration_sec: number | null;
  generated_at: number | null;
  error:        string | null;
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

  // ── Stage endpoints ──────────────────────────────────────────────────────────

  async healthCheck(): Promise<void> {
    const res = await fetch(`${BASE}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`${res.status}`);
  },

  runStage(
    projectId: string,
    stageId:   string,
    options: {
      track?:             'fast' | 'cmbagent';
      journal?:           string;
      writer?:            string;
      n_keywords?:        number;
      openai_api_key?:    string;
      anthropic_api_key?: string;
      google_api_key?:    string;
    } = {},
  ): Promise<{ project_id: string; stage_id: string; status: StageStatus }> {
    const { track, journal, writer, n_keywords, ...apiKeys } = options;
    return req(`/projects/${projectId}/stages/${stageId}/run`, {
      method: 'POST',
      body: JSON.stringify({
        track:      track      ?? 'fast',
        journal:    journal    ?? 'NONE',
        writer:     writer     ?? 'scientist',
        n_keywords: n_keywords ?? 5,
        ...apiKeys,
      }),
    });
  },

  stopStage(projectId: string, stageId: string): Promise<{ message: string }> {
    return req(`/projects/${projectId}/stages/${stageId}/stop`, { method: 'POST' });
  },

  approveStage(
    projectId:     string,
    stageId:       string,
    editedContent?: string,
  ): Promise<{ message: string }> {
    return req(`/projects/${projectId}/stages/${stageId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ edited_content: editedContent ?? null }),
    });
  },

  getStageResult(projectId: string, stageId: string): Promise<BackendStageResult> {
    return req(`/projects/${projectId}/stages/${stageId}/result`);
  },

  // ── File URLs ────────────────────────────────────────────────────────────────

  fileUrl(projectId: string, filePath: string): string {
    return `${V1}/projects/${projectId}/files/${filePath}`;
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
};
