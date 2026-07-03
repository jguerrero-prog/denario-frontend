import { create } from 'zustand';
import type { Pipeline, Stage, StageId, StageStatus, StageResult, ModelConfig, Message, Track, InputFile } from '../types/pipeline';
import type { BackendProject } from '../api/client';
import { MOCK_PIPELINE } from './mockPipeline';
import { nextStage, STAGE_CONFIG, STAGE_ORDER } from '../config/stageConfig';

interface PipelineStore {
  pipeline: Pipeline | null;
  backendProjectId: string | null;   // UUID assigned by the FastAPI server

  // Pipeline lifecycle
  createPipeline: (inputText: string, inputFile?: InputFile) => string; // returns new project id
  hydratePipeline: (backendProject: BackendProject) => string;           // load existing backend project; returns frontend id
  setPipeline: (pipeline: Pipeline) => void;
  clearPipeline: () => void;
  setBackendProjectId: (id: string) => void;

  // Stage actions
  setStageStatus: (stageId: StageId, status: StageStatus) => void;
  setStageError: (stageId: StageId, error: string) => void;
  setStageTrack: (stageId: StageId, track: Track) => void;
  setStageModel: (stageId: StageId, roleKey: string, model: ModelConfig) => void;
  setStageParam: (stageId: StageId, key: string, value: string | number | boolean) => void;
  setStageResult: (stageId: StageId, result: StageResult) => void;
  approveStage: (stageId: StageId) => void;  // completes stage + unlocks next
  setActiveStage: (stageId: StageId) => void;

  // Conversation
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string; // returns generated id
  updateMessage: (id: string, patch: Partial<Message>) => void;
}

// ── Pipeline factory ──────────────────────────────────────────────────────────

function buildPipeline(id: string, inputText: string, inputFile?: InputFile): Pipeline {
  const now = Date.now();
  const stages = Object.fromEntries(
    STAGE_ORDER.map((sid, idx) => [
      sid,
      {
        id: sid,
        status: idx === 0 ? 'idle' : 'locked',
        models: Object.fromEntries(
          STAGE_CONFIG[sid].modelRoles.map(r => [r.key, r.default])
        ),
        params: Object.fromEntries(
          STAGE_CONFIG[sid].paramFields.map(f => [f.key, f.default])
        ),
      } as Stage,
    ])
  ) as Pipeline['stages'];

  return {
    id,
    name: deriveProjectName(inputText),
    workspace: '~/research/',
    inputFile,
    inputText,
    preferredTools: '',
    mode: 'pipeline',
    activeStageId: 'input',
    stages,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        type: 'text',
        content: inputText,
        stageId: 'input',
        timestamp: now,
      },
      // No initial stage-prompt — input stage auto-starts on page load
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function deriveProjectName(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 4).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'new-project';
}

// ── Stage helpers ─────────────────────────────────────────────────────────────

function updateStage(pipeline: Pipeline, stageId: StageId, patch: Partial<Stage>): Pipeline {
  return {
    ...pipeline,
    stages: {
      ...pipeline.stages,
      [stageId]: { ...pipeline.stages[stageId], ...patch },
    },
    updatedAt: Date.now(),
  };
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  pipeline: MOCK_PIPELINE,
  backendProjectId: null,

  setBackendProjectId: (id) => set({ backendProjectId: id }),

  createPipeline: (inputText, inputFile) => {
    const id = `proj-${Date.now()}`;
    const pipeline = buildPipeline(id, inputText, inputFile);
    set({ pipeline });
    return id;
  },

  hydratePipeline: (backendProject) => {
    const id = `proj-${Date.now()}`;
    // Map backend stage statuses onto a fresh pipeline
    const pipeline = buildPipeline(id, '', undefined);
    const backendStatuses = backendProject.stages;

    // Apply each backend status; keep frontend types in sync
    const statusMap: Record<string, StageStatus> = {
      locked: 'locked', idle: 'idle', running: 'idle', // treat running as idle on resume
      complete: 'complete', error: 'error',
    };

    const updatedStages = { ...pipeline.stages };
    for (const sid of STAGE_ORDER) {
      const bs = backendStatuses[sid];
      if (bs) {
        updatedStages[sid as StageId] = {
          ...updatedStages[sid as StageId],
          status: statusMap[bs.status] ?? 'locked',
        };
      }
    }

    // Determine the stage to land on: first idle/error, or last complete
    const activeStageId = (
      STAGE_ORDER.find(s => updatedStages[s as StageId].status === 'error') ??
      STAGE_ORDER.find(s => updatedStages[s as StageId].status === 'idle') ??
      [...STAGE_ORDER].reverse().find(s => updatedStages[s as StageId].status === 'complete') ??
      'input'
    ) as StageId;

    const hydratedPipeline: Pipeline = {
      ...pipeline,
      name: backendProject.name,
      stages: updatedStages,
      activeStageId,
    };

    set({ pipeline: hydratedPipeline, backendProjectId: backendProject.id });
    return id;
  },

  setPipeline: (pipeline) => set({ pipeline }),
  clearPipeline: () => set({ pipeline: null }),

  setStageStatus: (stageId, status) =>
    set(({ pipeline }) =>
      pipeline ? { pipeline: updateStage(pipeline, stageId, { status }) } : {}
    ),

  setStageError: (stageId, error) =>
    set(({ pipeline }) =>
      pipeline ? { pipeline: updateStage(pipeline, stageId, { status: 'error', error }) } : {}
    ),

  setStageTrack: (stageId, track) =>
    set(({ pipeline }) =>
      pipeline ? { pipeline: updateStage(pipeline, stageId, { track }) } : {}
    ),

  setStageModel: (stageId, roleKey, model) =>
    set(({ pipeline }) => {
      if (!pipeline) return {};
      const stage = pipeline.stages[stageId];
      return {
        pipeline: updateStage(pipeline, stageId, {
          models: { ...stage.models, [roleKey]: model },
        }),
      };
    }),

  setStageParam: (stageId, key, value) =>
    set(({ pipeline }) => {
      if (!pipeline) return {};
      const stage = pipeline.stages[stageId];
      return {
        pipeline: updateStage(pipeline, stageId, {
          params: { ...stage.params, [key]: value },
        }),
      };
    }),

  setStageResult: (stageId, result) =>
    set(({ pipeline }) =>
      pipeline ? { pipeline: updateStage(pipeline, stageId, { result }) } : {}
    ),

  approveStage: (stageId) =>
    set(({ pipeline }) => {
      if (!pipeline) return {};
      let updated = updateStage(pipeline, stageId, { status: 'complete' });
      const next = nextStage(stageId);
      if (next && updated.stages[next].status === 'locked') {
        updated = updateStage(updated, next, { status: 'idle' });
        updated = { ...updated, activeStageId: next };
      }
      if (next) {
        const now = Date.now();
        const stageLabel = STAGE_CONFIG[stageId].label;
        const nextLabel = STAGE_CONFIG[next].label;
        const systemMsg: Message = {
          id: `msg-sys-${now}`,
          role: 'denario',
          type: 'system',
          content: `Stage · ${stageLabel} complete — ${nextLabel} unlocked.`,
          timestamp: now,
        };
        const promptMsg: Message = {
          id: `msg-prompt-${now}`,
          role: 'denario',
          type: 'stage-prompt',
          content: STAGE_CONFIG[next].denarioOpener,
          stageId: next,
          timestamp: now + 100,
        };
        updated = {
          ...updated,
          messages: [...updated.messages, systemMsg, promptMsg],
          updatedAt: now,
        };
      }
      return { pipeline: updated };
    }),

  setActiveStage: (stageId) =>
    set(({ pipeline }) =>
      pipeline ? { pipeline: { ...pipeline, activeStageId: stageId } } : {}
    ),

  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set(({ pipeline }) => {
      if (!pipeline) return {};
      const message: Message = { ...msg, id, timestamp: Date.now() };
      return {
        pipeline: {
          ...pipeline,
          messages: [...pipeline.messages, message],
          updatedAt: Date.now(),
        },
      };
    });
    return id;
  },

  updateMessage: (id, patch) =>
    set(({ pipeline }) => {
      if (!pipeline) return {};
      return {
        pipeline: {
          ...pipeline,
          messages: pipeline.messages.map(m => (m.id === id ? { ...m, ...patch } : m)),
        },
      };
    }),
}));

// Convenience selectors
export const selectPipeline = (s: PipelineStore) => s.pipeline;
export const selectStage = (stageId: StageId) => (s: PipelineStore) =>
  s.pipeline?.stages[stageId];
export const selectMessages = (s: PipelineStore) => s.pipeline?.messages ?? [];
export const selectActiveStageId = (s: PipelineStore) => s.pipeline?.activeStageId;
