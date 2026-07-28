import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Provider = 'openai' | 'anthropic' | 'google';

interface ApiKeys {
  openai:    string;
  anthropic: string;
  google:    string;
}

// Stages with a real per-agent model choice, per CLAUDE.md's "Per-Stage Model
// Configuration" table. Only applies on the Rigorous/cmbagent track for
// Idea/Methods (see ROADMAP.md ticket 1.6) — Fast track's single unified
// model isn't exposed here yet.
export type ModelOverrideStage = 'idea' | 'methods' | 'analysis' | 'paper';

// Role keys per stage (e.g. "idea_maker", "engineer") are free-form strings —
// the fixed set for each stage lives in SettingsModal's STAGE_SECTIONS, not
// in this store's types, since only that one render site needs them.
export type ModelOverrideRoles = Record<ModelOverrideStage, Record<string, string | undefined>>;

const EMPTY_MODEL_OVERRIDES: ModelOverrideRoles = {
  idea:     {},
  methods:  {},
  analysis: {},
  paper:    {},
};

interface ConfigStore {
  apiKeys: ApiKeys;
  setApiKey:  (provider: Provider, key: string) => void;
  clearApiKeys: () => void;
  // Returns only non-empty keys, shaped for the backend request body.
  getApiKeyPayload: () => {
    openai_api_key?:    string;
    anthropic_api_key?: string;
    google_api_key?:    string;
  };

  modelOverrides: ModelOverrideRoles;
  setModelOverride: (stage: ModelOverrideStage, role: string, modelId: string) => void;
  clearModelOverrides: () => void;
  // Non-empty role -> model entries for one stage, shaped for
  // RunStageRequest.model_overrides.
  getModelOverridesPayload: (stage: ModelOverrideStage) => Record<string, string>;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      apiKeys: { openai: '', anthropic: '', google: '' },

      setApiKey: (provider, key) =>
        set(s => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),

      clearApiKeys: () =>
        set({ apiKeys: { openai: '', anthropic: '', google: '' } }),

      getApiKeyPayload: () => {
        const { openai, anthropic, google } = get().apiKeys;
        return {
          ...(openai    ? { openai_api_key:    openai    } : {}),
          ...(anthropic ? { anthropic_api_key: anthropic } : {}),
          ...(google    ? { google_api_key:    google    } : {}),
        };
      },

      modelOverrides: EMPTY_MODEL_OVERRIDES,

      setModelOverride: (stage, role, modelId) =>
        set(s => ({
          modelOverrides: {
            ...s.modelOverrides,
            [stage]: { ...s.modelOverrides[stage], [role]: modelId },
          },
        })),

      clearModelOverrides: () => set({ modelOverrides: EMPTY_MODEL_OVERRIDES }),

      getModelOverridesPayload: stage => {
        const roles = get().modelOverrides[stage];
        const payload: Record<string, string> = {};
        for (const [role, modelId] of Object.entries(roles)) {
          if (modelId) payload[role] = modelId;
        }
        return payload;
      },
    }),
    { name: 'denario-config' },
  ),
);
