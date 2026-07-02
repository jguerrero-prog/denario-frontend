import { useState } from 'react';
import { useConfigStore, type Provider } from '../../../store/configStore';
import styles from './ApiKeysModal.module.css';

interface Props {
  onClose: () => void;
}

const PROVIDERS: { id: Provider; label: string; placeholder: string }[] = [
  { id: 'openai',    label: 'OpenAI',    placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'google',    label: 'Google',    placeholder: 'AIza...' },
];

export function ApiKeysModal({ onClose }: Props) {
  const { apiKeys, setApiKey } = useConfigStore();
  const [draft, setDraft] = useState({ ...apiKeys });
  const [visible, setVisible] = useState<Record<Provider, boolean>>({
    openai: false, anthropic: false, google: false,
  });

  function save() {
    for (const p of PROVIDERS) setApiKey(p.id, draft[p.id]);
    onClose();
  }

  const hasKeys = PROVIDERS.some(p => draft[p.id].trim());

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-label="API Keys">
        <div className={styles.header}>
          <span className={styles.title}>API Keys</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

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
                  value={draft[id]}
                  placeholder={placeholder}
                  onChange={e => setDraft(d => ({ ...d, [id]: e.target.value }))}
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

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={save}>Save</button>
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
