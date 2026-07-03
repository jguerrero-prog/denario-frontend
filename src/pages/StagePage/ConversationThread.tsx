import { useState, useEffect, useRef } from 'react';
import { usePipelineStore } from '../../store/pipelineStore';
import { startStage } from '../../utils/stageRunner';
import { StageResultCard } from './ResultCards/ResultCards';
import type { Message, StageId } from '../../types/pipeline';
import styles from './StagePage.module.css';

// ── Cycling status ─────────────────────────────────────────────────────────────

const STAGE_STATUSES: Record<string, string[]> = {
  input:      ['Summarising research scope…', 'Formatting dataset context…', 'Validating tool configuration…'],
  idea:       ['Initialising adversarial loop…', 'idea_maker proposing hypothesis…', 'idea_hater reviewing for weaknesses…', 'Refining — iteration 2 of 4…', 'Stress-testing temporal scope…', 'Hypothesis converging…'],
  methods:    ['Planner drafting roadmap…', 'Plan reviewer critiquing…', 'Method generator finalising…', 'Validating statistical approach…'],
  analysis:   ['Writing Python scripts…', 'Executing in sandbox…', 'Analysing output…', 'Self-healing error in line 47…', 'Re-running corrected script…', 'Results converging…'],
  paper:      ['Drafting introduction…', 'Weaving citations…', 'Embedding figures…', 'Compiling LaTeX…'],
  literature: ['Searching Semantic Scholar…', 'Scanning uploaded references…', 'Identifying overlaps…', 'Summarising related work…'],
  referee:    ['Simulating Reviewer A…', 'Simulating Reviewer B…', 'Compiling revision verdict…'],
  keywords:   ['Extracting primary terms…', 'Grouping by methodology…', 'Classifying domain terms…'],
};

function CyclingStatus({ stageId }: { stageId: StageId }) {
  const statuses = STAGE_STATUSES[stageId] ?? STAGE_STATUSES.idea;
  const stageStatus = usePipelineStore(s => s.pipeline?.stages[stageId]?.status);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const isRunning = stageStatus === 'running';

  useEffect(() => {
    if (!isRunning) return;
    let swap: ReturnType<typeof setTimeout>;
    const hold = setTimeout(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIdx(i => (i + 1) % statuses.length);
        setVisible(true);
      }, 380);
    }, 2000);
    return () => { clearTimeout(hold); clearTimeout(swap); };
  }, [idx, isRunning]);

  if (!isRunning) {
    return (
      <div className={styles.cyclingStatus}>
        <div className={styles.cyclingDotDone} />
        <span className={styles.cyclingText}>Complete</span>
      </div>
    );
  }

  return (
    <div className={styles.cyclingStatus}>
      <div className={styles.cyclingDot} />
      <span className={styles.cyclingText} style={{ opacity: visible ? 1 : 0 }}>
        {statuses[idx]}
      </span>
    </div>
  );
}

// ── Individual message renderers ───────────────────────────────────────────────

// The first message in the thread — renders with file chip + tools line from pipeline
function InputBubble({ message }: { message: Message }) {
  const pipeline = usePipelineStore(s => s.pipeline);

  return (
    <div className={styles.userMessage}>
      <p className={styles.userMessageText}>{message.content}</p>
      {pipeline?.preferredTools && (
        <p className={styles.userToolsText}>
          Preferred tools: {pipeline.preferredTools}
        </p>
      )}
      {pipeline?.inputFile && (
        <div className={styles.fileChipInline}>
          <div className={styles.greenDot} />
          <span className={styles.fileChipMono}>{pipeline.inputFile.name}</span>
        </div>
      )}
    </div>
  );
}

// Short right-aligned bubble for user replies (track choices, free-form questions)
function UserReply({ message }: { message: Message }) {
  return (
    <div className={styles.userReply}>
      <span className={styles.userReplyText}>{message.content}</span>
    </div>
  );
}

function DenarioRing() {
  const r = 9;
  const circ = 2 * Math.PI * r;
  const seg  = circ / 4;
  const segments = [
    { color: '#16A34A', offset: 0 },
    { color: '#EA580C', offset: -seg },
    { color: '#2563EB', offset: -seg * 2 },
    { color: '#7C3AED', offset: -seg * 3 },
  ];
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {segments.map(({ color, offset }) => (
        <circle
          key={color}
          cx="12" cy="12" r={r}
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${seg} ${circ - seg}`}
          strokeDashoffset={offset}
          transform="rotate(-90 12 12)"
        />
      ))}
    </svg>
  );
}

function DenarioBubble({ message, children }: { message: Message; children?: React.ReactNode }) {
  const timeLabel = formatTime(message.timestamp);
  return (
    <div className={styles.aiResponse}>
      <div className={styles.aiHeader}>
        <div className={styles.aiHeaderLeft}>
          <div className={styles.aiAvatar}><DenarioRing /></div>
          <span className={styles.aiName}>Denario</span>
        </div>
        <span className={styles.aiTimestamp}>{timeLabel}</span>
      </div>
      {message.content && <p className={styles.aiText}>{message.content}</p>}
      {children}
    </div>
  );
}

function StagePromptBubble({ message }: { message: Message }) {
  const setStageTrack = usePipelineStore(s => s.setStageTrack);
  const addMessage = usePipelineStore(s => s.addMessage);
  const pipeline = usePipelineStore(s => s.pipeline);
  const stageId = message.stageId!;
  const stage = pipeline?.stages[stageId];

  // If stage already has a track chosen, don't show buttons
  const isDecided = stage?.track !== undefined;

  function choose(track: 'fast' | 'standard') {
    setStageTrack(stageId, track);
    addMessage({
      role: 'user',
      type: 'text',
      content: track === 'fast' ? 'Fast Track — Quick pass' : 'Standard — Adversarial loop',
      stageId,
    });
    startStage(stageId, track);
  }

  return (
    <DenarioBubble message={message}>
      {!isDecided && (
        <div className={styles.aiActions}>
          <div className={styles.aiActionRow}>
            <button className={styles.actionPrimary} onClick={() => choose('standard')}>
              Standard — Adversarial loop
            </button>
            <button className={styles.actionSecondary} onClick={() => choose('fast')}>
              Fast Track — Quick pass
            </button>
          </div>
          <p className={styles.actionHint}>Standard is recommended for peer-review submissions.</p>
        </div>
      )}
    </DenarioBubble>
  );
}

// ── Message renderer ───────────────────────────────────────────────────────────

function MessageRenderer({ message, isFirst }: { message: Message; isFirst: boolean }) {
  if (message.role === 'user') {
    return isFirst ? <InputBubble message={message} /> : <UserReply message={message} />;
  }

  switch (message.type) {
    case 'stage-prompt':
      return <StagePromptBubble message={message} />;
    case 'status':
      return (
        <DenarioBubble message={message}>
          <CyclingStatus stageId={(message.stageId ?? 'idea') as StageId} />
        </DenarioBubble>
      );
    case 'result-card':
      return (
        <DenarioBubble message={message}>
          {message.stageId && <StageResultCard stageId={message.stageId} />}
        </DenarioBubble>
      );
    case 'system':
      return <p className={styles.systemMessage}>{message.content}</p>;
    default:
      return <DenarioBubble message={message} />;
  }
}

// ── Compose bar ────────────────────────────────────────────────────────────────

function PaperclipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ComposeBar({ stageId }: { stageId: StageId }) {
  const [text, setText] = useState('');
  const addMessage = usePipelineStore(s => s.addMessage);
  const pipeline = usePipelineStore(s => s.pipeline);
  const stage = pipeline?.stages[stageId];
  const isRunning = stage?.status === 'running';

  const placeholder = stage?.status === 'complete'
    ? 'Ask Denario to refine or discuss the results…'
    : 'Ask Denario anything or add more context…';

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage({ role: 'user', type: 'text', content: trimmed, stageId });
    setText('');
  }

  return (
    <div className={styles.composeArea}>
      {isRunning ? (
        <div className={styles.composeRunning}>
          <div className={styles.composeRunningDot} />
          <span className={styles.composeRunningLabel}>Denario is working…</span>
          <button
            className={styles.composeStopBtn}
            onClick={() => stopStage(stageId)}
          >
            ◼ Stop
          </button>
        </div>
      ) : (
      <div className={styles.composeBar}>
        <span className={styles.composeClip}><PaperclipIcon /></span>
        <input
          className={styles.composeInput}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
        />
        <button className={styles.sendBtn} onClick={submit} aria-label="Send">
          <ArrowUpIcon />
        </button>
      </div>
      )}
    </div>
  );
}

// ── Thread ─────────────────────────────────────────────────────────────────────

interface ConversationThreadProps {
  stageId: StageId;
}

export function ConversationThread({ stageId }: ConversationThreadProps) {
  const messages = usePipelineStore(s => s.pipeline?.messages ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Input stage requires no track choice — auto-start it silently on mount.
  useEffect(() => {
    if (stageId !== 'input') return;
    const stage = usePipelineStore.getState().pipeline?.stages.input;
    if (stage?.status === 'idle') {
      startStage('input', 'fast');
    }
  }, [stageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      <div className={styles.conversationViewport}>
        <div className={styles.conversationStack}>
          {messages.map((msg, idx) => (
            <MessageRenderer key={msg.id} message={msg} isFirst={idx === 0} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <ComposeBar stageId={stageId} />
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}
