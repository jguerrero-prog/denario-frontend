import { useEffect, useState } from 'react';
import { useConfigStore, type Provider, type ModelOverrideStage } from '../../../store/configStore';
import { api } from '../../../api/client';
import styles from './SettingsModal.module.css';

interface Props {
  onClose: () => void;
}

type Tab = 'keys' | 'models';

const PROVIDERS: { id: Provider; label: string; placeholder: string }[] = [
  { id: 'openai',    label: 'OpenAI',    placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'google',    label: 'Google',    placeholder: 'AIza...' },
];

// Per CLAUDE.md's "Per-Stage Model Configuration" table. Lit Enhancement's
// Summarizer/Response Formatter fields are intentionally absent — that
// feature isn't wired to any run endpoint yet (ROADMAP.md Epic 6's
// easy-wins note), so there'd be nothing for a selection here to reach.
const STAGE_SECTIONS: {
  stage: ModelOverrideStage;
  title: string;
  roles: { key: string; label: string }[];
  note?: string;
}[] = [
  {
    stage: 'idea', title: 'Idea',
    roles: [
      { key: 'idea_maker', label: 'Idea Maker' },
      { key: 'idea_hater', label: 'Idea Hater' },
    ],
    note: 'Rigorous track only',
  },
  {
    stage: 'methods', title: 'Methods',
    roles: [
      { key: 'planner', label: 'Planner' },
      { key: 'plan_reviewer', label: 'Plan Reviewer' },
      { key: 'method_generator', label: 'Method Generator' },
    ],
    note: 'Rigorous track only',
  },
  {
    stage: 'analysis', title: 'Analysis',
    roles: [
      { key: 'engineer', label: 'Engineer' },
      { key: 'researcher', label: 'Researcher' },
    ],
  },
  {
    stage: 'paper', title: 'Paper',
    roles: [
      { key: 'paper_writer', label: 'Writing Model' },
    ],
  },
];

export function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('keys');
  const { apiKeys, setApiKey, modelOverrides, setModelOverride } = useConfigStore();
  const [draftKeys, setDraftKeys] = useState({ ...apiKeys });
  const [visible, setVisible] = useState<Record<Provider, boolean>>({
    openai: false, anthropic: false, google: false,
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsError, setModelsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.listModels()
      .then(res => { if (!cancelled) setAvailableModels(res.models); })
      .catch(() => { if (!cancelled) setModelsError(true); });
    return () => { cancelled = true; };
  }, []);

  function saveKeys() {
    for (const p of PROVIDERS) setApiKey(p.id, draftKeys[p.id]);
    onClose();
  }

  const hasKeys = PROVIDERS.some(p => draftKeys[p.id].trim());

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-label="Settings">
        <div className={styles.header}>
          <span className={styles.title}>Settings</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'keys'}
            className={tab === 'keys' ? styles.tabActive : styles.tab}
            onClick={() => setTab('keys')}
          >
            API Keys
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'models'}
            className={tab === 'models' ? styles.tabActive : styles.tab}
            onClick={() => setTab('models')}
          >
            Models
          </button>
        </div>

        {tab === 'keys' && (
          <>
            <p className={styles.description}>
              Keys are stored locally in your browser and forwarded to the backend at runtime to authenticate with each AI provider.
            </p>

            <div className={styles.fields}>
              {PROVIDERS.map(({ id, label, placeholder }) => (
                <div key={id} className={styles.field}>
                  <label className={styles.label} htmlFor={`key-${id}`}>{label}</label>
                  <div className={styles.inputRow}>
                    <input
                      id={`key-${id}`}
                      className={styles.input}
                      type={visible[id] ? 'text' : 'password'}
                      value={draftKeys[id]}
                      placeholder={placeholder}
                      onChange={e => setDraftKeys(d => ({ ...d, [id]: e.target.value }))}
                      spellCheck={false}
                      autoComplete="off"
                    />
                    <button
                      className={styles.toggleVisBtn}
                      type="button"
                      onClick={() => setVisible(v => ({ ...v, [id]: !v[id] }))}
                      aria-label={visible[id] ? 'Hide key' : 'Show key'}
                    >
                      {visible[id] ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!hasKeys && (
              <p className={styles.hint}>
                At least one key is required to run stages against the live backend.
              </p>
            )}
          </>
        )}

        {tab === 'models' && (
          <>
            <p className={styles.description}>
              Pick which model handles each agent role. Leave a role on "Default" to use the backend's built-in choice.
            </p>

            {modelsError && (
              <p className={styles.hint}>Couldn't load the available model list from the backend.</p>
            )}

            {/* Applied to the store immediately on change (a <select> can't
                land in an invalid mid-edit state the way a typed API key
                can), so unlike the Keys tab there's no draft to discard —
                Cancel below only affects the Keys tab. */}
            <div className={styles.stageSections}>
              {STAGE_SECTIONS.map(({ stage, title, roles, note }) => (
                <div key={stage} className={styles.stageSection}>
                  <div className={styles.stageSectionHeader}>
                    <span className={styles.stageSectionTitle}>{title}</span>
                    {note && <span className={styles.stageSectionNote}>{note}</span>}
                  </div>
                  <div className={styles.fields}>
                    {roles.map(({ key, label }) => (
                      <div key={key} className={styles.field}>
                        <label className={styles.label} htmlFor={`model-${stage}-${key}`}>{label}</label>
                        <select
                          id={`model-${stage}-${key}`}
                          className={styles.select}
                          value={modelOverrides[stage][key] ?? ''}
                          onChange={e => setModelOverride(stage, key, e.target.value)}
                        >
                          <option value="">Default</option>
                          {availableModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>{tab === 'keys' ? 'Cancel' : 'Close'}</button>
          {tab === 'keys' && <button className={styles.saveBtn} onClick={saveKeys}>Save</button>}
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1l22 22" />
    </svg>
  );
}
