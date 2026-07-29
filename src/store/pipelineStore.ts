import { create } from 'zustand';
import type { Pipeline, Stage, StageId, StageStatus, StageResult, ModelConfig, Message, Track, InputFile, IdeaResultData, IdeaTranscriptRound, MethodsResultData, MethodsPlanningTurn, MethodsExecutionStep, LiteratureResultData, SearchedPaper } from '../types/pipeline';
import type { BackendProject } from '../api/client';
import { MOCK_PIPELINE } from './mockPipeline';
import { nextStage, STAGE_CONFIG, STAGE_ORDER } from '../config/stageConfig';
import { parseBackendResult } from '../utils/parsers';
import { buildMockResult, fetchIdeaTranscript, fetchIdeaLog, fetchMethodsLog, fetchSearchedPapers } from '../utils/stageRunner';

interface PipelineStore {
  pipeline: Pipeline | null;
  backendProjectId: string | null;   // UUID assigned by the FastAPI server

  // Pipeline lifecycle
  createPipeline: (inputText: string, inputFiles?: InputFile[], track?: Track) => string; // returns new project id
  createModularPipeline: (targetStage: StageId, inputText: string, inputFiles?: InputFile[], track?: Track) => string; // Modular jump-to-stage entry from Homepage; returns new project id
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
  setIdeaTranscript: (transcript: IdeaTranscriptRound[]) => void;
  setIdeaLog: (planningLog: MethodsPlanningTurn[], executionLog: MethodsExecutionStep[]) => void;
  setMethodsLog: (planningLog: MethodsPlanningTurn[], executionLog: MethodsExecutionStep[]) => void;
  setLiteratureSearchedPapers: (papers: SearchedPaper[]) => void;
  approveStage: (stageId: StageId) => void;  // completes stage + unlocks next
  unlockNextStage: (stageId: StageId) => void;  // like approveStage, but adds no conversation messages
  setActiveStage: (stageId: StageId) => void;
  ensureStagePrompt: (stageId: StageId) => void;  // Modular jump to a never-reached stage: insert its stage-prompt on demand; no-op if the stage already has any messages

  // Conversation
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string; // returns generated id
  updateMessage: (id: string, patch: Partial<Message>) => void;
  removeMessage: (id: string) => void;
}

// ── Pipeline factory ──────────────────────────────────────────────────────────

function buildPipeline(id: string, inputText: string, inputFiles?: InputFile[], track?: Track): Pipeline {
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
    inputFiles,
    inputText,
    preferredTools: '',
    mode: 'pipeline',
    initialTrack: track,
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

// Modular jump-to-stage entry: unlike buildPipeline, every stage starts
// 'idle' (not sequentially locked), and a stage-prompt message for the
// chosen target stage is inserted directly — reusing the exact same
// StagePromptBubble -> track choice -> startStage() mechanism that normally
// only fires via sequential approveStage(), rather than a separate trigger.
function buildModularPipeline(
  id: string,
  targetStage: StageId,
  inputText: string,
  inputFiles?: InputFile[],
  track?: Track,
): Pipeline {
  const now = Date.now();
  const stages = Object.fromEntries(
    STAGE_ORDER.map((sid) => [
      sid,
      {
        id: sid,
        status: 'idle',
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
    inputFiles,
    inputText,
    preferredTools: '',
    mode: 'modular',
    initialTrack: track,
    activeStageId: targetStage,
    stages,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        type: 'text',
        content: inputText,
        stageId: targetStage,
        timestamp: now,
      },
      {
        id: 'msg-2',
        role: 'denario',
        type: 'stage-prompt',
        content: STAGE_CONFIG[targetStage].denarioOpener,
        stageId: targetStage,
        timestamp: now + 50,
      },
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

  createPipeline: (inputText, inputFiles, track) => {
    const id = `proj-${Date.now()}`;
    const pipeline = buildPipeline(id, inputText, inputFiles, track);
    set({ pipeline });
    return id;
  },

  createModularPipeline: (targetStage, inputText, inputFiles, track) => {
    const id = `proj-${Date.now()}`;
    const pipeline = buildModularPipeline(id, targetStage, inputText, inputFiles, track);
    set({ pipeline });
    return id;
  },

  hydratePipeline: (backendProject) => {
    // Use the backend's real project id, not a synthetic one — this is what
    // makes the URL (/project/:projectId/...) resolvable by api.getProject()
    // on a later page refresh. A synthetic per-hydration id here would mean
    // the URL never matches anything the backend recognizes.
    const id = backendProject.id;
    const inputText = backendProject.stages['input']?.content ?? '';
    const pipeline = buildPipeline(id, inputText, undefined);
    const backendStatuses = backendProject.stages;

    const statusMap: Record<string, StageStatus> = {
      locked: 'locked', idle: 'idle', running: 'idle',
      complete: 'complete', error: 'error',
    };

    // Map statuses and restore parsed results for completed stages
    const updatedStages = { ...pipeline.stages };
    for (const sid of STAGE_ORDER) {
      const bs = backendStatuses[sid];
      if (!bs) continue;
      const status = statusMap[bs.status] ?? 'locked';
      let result: StageResult | undefined;
      if (status === 'complete' && bs.content) {
        // Every stage needs a template to seed unparsed fields, but only
        // 'input' has a real MOCK_PIPELINE entry — buildMockResult() (already
        // used by stageRunner.ts for the live-run path) generates one for any
        // stage/track, so real backend content is never silently dropped here.
        const template = buildMockResult(sid as StageId, 'standard');
        result = parseBackendResult(sid as StageId, 'standard' as Track, bs.content, bs.duration_sec, template, bs.structured);
      }
      updatedStages[sid as StageId] = {
        ...updatedStages[sid as StageId],
        status,
        ...(result ? { result } : {}),
        ...(status === 'error' ? { error: bs.error ?? 'An unexpected error occurred.' } : {}),
        stale: bs.stale,
        staleBecause: bs.stale_because as StageId[],
      };
    }

    // Reconstruct conversation messages from unlocked stages
    const now = backendProject.created_at ? backendProject.created_at * 1000 : Date.now();
    const messages: Message[] = [
      {
        id: 'msg-1',
        role: 'user',
        type: 'text',
        content: inputText,
        stageId: 'input',
        timestamp: now,
      },
    ];
    for (const sid of STAGE_ORDER) {
      if (sid === 'input') continue;
      const stage = updatedStages[sid as StageId];
      if (stage.status === 'locked') continue;
      const prevSid = STAGE_ORDER[STAGE_ORDER.indexOf(sid) - 1];
      messages.push({
        id: `msg-sys-${sid}`,
        role: 'denario',
        type: 'system',
        content: `Stage · ${STAGE_CONFIG[prevSid as StageId].label} complete — ${STAGE_CONFIG[sid as StageId].label} unlocked.`,
        timestamp: now,
      });
      if (stage.status === 'complete' || stage.status === 'error') {
        // 'error' also gets a result-card message — StageResultCard checks
        // stage.status === 'error' first and renders the ErrorCard (with the
        // real error text + Retry button) instead of the normal result body.
        messages.push({
          id: `msg-result-${sid}`,
          role: 'denario',
          type: 'result-card',
          content: stage.status === 'error'
            ? 'Stage failed — see the error below.'
            : stage.result
              ? `Generated in ${stage.result.durationLabel}. Review the output below.`
              : 'Stage complete.',
          stageId: sid as StageId,
          track: stage.result?.track,
          timestamp: now + 100,
        });
      } else {
        messages.push({
          id: `msg-prompt-${sid}`,
          role: 'denario',
          type: 'stage-prompt',
          content: STAGE_CONFIG[sid as StageId].denarioOpener,
          stageId: sid as StageId,
          timestamp: now + 100,
        });
      }
    }

    const activeStageId = (
      STAGE_ORDER.find(s => updatedStages[s as StageId].status === 'error') ??
      STAGE_ORDER.find(s => updatedStages[s as StageId].status === 'idle') ??
      [...STAGE_ORDER].reverse().find(s => updatedStages[s as StageId].status === 'complete') ??
      'input'
    ) as StageId;

    const hydratedPipeline: Pipeline = {
      ...pipeline,
      name: backendProject.name,
      inputText,
      stages: updatedStages,
      messages,
      activeStageId,
    };

    set({ pipeline: hydratedPipeline, backendProjectId: backendProject.id });

    if (updatedStages.idea.status === 'complete' && updatedStages.idea.result) {
      fetchIdeaTranscript(id).then(transcript => {
        if (transcript.length > 0) get().setIdeaTranscript(transcript);
      });
      // Ticket 2.2 — mutually exclusive with the Fast-track transcript
      // above in practice (a project has idea.log XOR the Rigorous JSON
      // files), so firing both fetches is harmless: at most one resolves
      // with real content.
      fetchIdeaLog(id).then(({ planningLog, executionLog }) => {
        if (planningLog.length > 0 || executionLog.length > 0) get().setIdeaLog(planningLog, executionLog);
      });
    }

    if (updatedStages.methods.status === 'complete' && updatedStages.methods.result) {
      fetchMethodsLog(id).then(({ planningLog, executionLog }) => {
        if (planningLog.length > 0 || executionLog.length > 0) get().setMethodsLog(planningLog, executionLog);
      });
    }

    if (updatedStages.literature.status === 'complete' && updatedStages.literature.result) {
      fetchSearchedPapers(id).then(papers => {
        if (papers.length > 0) get().setLiteratureSearchedPapers(papers);
      });
    }

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

  // Patches in the adversarial-loop transcript once idea.log has been
  // fetched and parsed — a side channel from setStageResult since it comes
  // from a separate file, arriving after the idea result itself is set.
  setIdeaTranscript: (transcript) =>
    set(({ pipeline }) => {
      const stage = pipeline?.stages.idea;
      if (!pipeline || !stage?.result) return {};
      const stageData = stage.result.stageData as IdeaResultData;
      return {
        pipeline: updateStage(pipeline, 'idea', {
          result: { ...stage.result, stageData: { ...stageData, transcript } },
        }),
      };
    }),

  // Ticket 2.2 — same shape as setMethodsLog, but for Idea's Rigorous-track
  // log (idea.log/setIdeaTranscript above is the Fast-track counterpart;
  // the two are mutually exclusive in practice, never both populated for
  // the same project).
  setIdeaLog: (planningLog, executionLog) =>
    set(({ pipeline }) => {
      const stage = pipeline?.stages.idea;
      if (!pipeline || !stage?.result) return {};
      const stageData = stage.result.stageData as IdeaResultData;
      return {
        pipeline: updateStage(pipeline, 'idea', {
          result: { ...stage.result, stageData: { ...stageData, planningLog, executionLog } },
        }),
      };
    }),

  // Same reasoning as setIdeaTranscript — Methods' Rigorous-track log comes
  // from several separate JSON files, arriving after the methods result
  // itself is set.
  setMethodsLog: (planningLog, executionLog) =>
    set(({ pipeline }) => {
      const stage = pipeline?.stages.methods;
      if (!pipeline || !stage?.result) return {};
      const stageData = stage.result.stageData as MethodsResultData;
      return {
        pipeline: updateStage(pipeline, 'methods', {
          result: { ...stage.result, stageData: { ...stageData, planningLog, executionLog } },
        }),
      };
    }),

  // Same reasoning as setIdeaTranscript/setMethodsLog — the full searched
  // corpus lives in a separate sidecar file, arriving after the literature
  // result itself is set.
  setLiteratureSearchedPapers: (papers) =>
    set(({ pipeline }) => {
      const stage = pipeline?.stages.literature;
      if (!pipeline || !stage?.result) return {};
      const stageData = stage.result.stageData as LiteratureResultData;
      return {
        pipeline: updateStage(pipeline, 'literature', {
          result: { ...stage.result, stageData: { ...stageData, searchedPapers: papers } },
        }),
      };
    }),

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

  unlockNextStage: (stageId) =>
    set(({ pipeline }) => {
      if (!pipeline) return {};
      let updated = updateStage(pipeline, stageId, { status: 'complete' });
      const next = nextStage(stageId);
      if (next && updated.stages[next].status === 'locked') {
        updated = updateStage(updated, next, { status: 'idle' });
        updated = { ...updated, activeStageId: next };
      }
      return { pipeline: updated };
    }),

  setActiveStage: (stageId) =>
    set(({ pipeline }) =>
      pipeline ? { pipeline: { ...pipeline, activeStageId: stageId } } : {}
    ),

  ensureStagePrompt: (stageId) =>
    set(({ pipeline }) => {
      if (!pipeline) return {};
      const alreadyReached = pipeline.messages.some(m => m.stageId === stageId);
      if (alreadyReached) return {};
      const message: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'denario',
        type: 'stage-prompt',
        content: STAGE_CONFIG[stageId].denarioOpener,
        stageId,
        timestamp: Date.now(),
      };
      return {
        pipeline: {
          ...pipeline,
          messages: [...pipeline.messages, message],
          updatedAt: Date.now(),
        },
      };
    }),

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

  removeMessage: (id) =>
    set(({ pipeline }) => {
      if (!pipeline) return {};
      return {
        pipeline: {
          ...pipeline,
          messages: pipeline.messages.filter(m => m.id !== id),
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
