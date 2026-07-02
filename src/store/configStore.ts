import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Provider = 'openai' | 'anthropic' | 'google';

interface ApiKeys {
  openai:    string;
  anthropic: string;
  google:    string;
}

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
    }),
    { name: 'denario-config' },
  ),
);
