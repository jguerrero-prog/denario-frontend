import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePipelineStore } from '../../store/pipelineStore';
import { startStage, stopStage } from '../../utils/stageRunner';
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
        <span className={styles.cyclingText}>Complete</span>
      </div>
    );
  }

  return (
    <div className={styles.cyclingStatus}>
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
        </div>
        <span className={styles.aiTimestamp}>{timeLabel}</span>
      </div>
      {message.content && <p className={styles.aiText}>{message.content}</p>}
      {children}
    </div>
  );
}

const TRACK_STAGES = new Set<StageId>(['idea', 'methods']);
// Stages whose entry point is a button on the previous stage's result card — no prompt button needed.
const NO_PROMPT_BUTTON_STAGES = new Set<StageId>(['analysis']);

function StagePromptBubble({ message }: { message: Message }) {
  const setStageTrack = usePipelineStore(s => s.setStageTrack);
  const addMessage = usePipelineStore(s => s.addMessage);
  const pipeline = usePipelineStore(s => s.pipeline);
  const stageId = message.stageId!;
  const stage = pipeline?.stages[stageId];
  const hasTrackChoice = TRACK_STAGES.has(stageId as StageId);
  const hasPromptButton = !NO_PROMPT_BUTTON_STAGES.has(stageId as StageId);

  // If stage already has a track chosen, don't show buttons
  const isDecided = stage?.track !== undefined;

  function choose(track: 'standard' | 'rigorous') {
    setStageTrack(stageId, track);
    addMessage({
      role: 'user',
      type: 'text',
      content: hasTrackChoice
        ? (track === 'standard' ? 'Standard' : 'Rigorous')
        : 'Generate →',
      stageId,
    });
    startStage(stageId, track);
  }

  return (
    <DenarioBubble message={message}>
      {!isDecided && hasPromptButton && (
        <div className={styles.aiActions}>
          {hasTrackChoice ? (
            <>
              <div className={styles.aiActionRow}>
                <button className={styles.actionPrimary} onClick={() => choose('rigorous')}>
                  Rigorous
                </button>
                <button className={styles.actionSecondary} onClick={() => choose('standard')}>
                  Standard
                </button>
              </div>
              <p className={styles.actionHint}>Rigorous is recommended for peer-review submissions.</p>
            </>
          ) : (
            <button className={styles.actionPrimary} onClick={() => choose('standard')}>
              Generate →
            </button>
          )}
        </div>
      )}
    </DenarioBubble>
  );
}

// Denario's elaboration on a clicked scope-constraint suggestion chip.
function SuggestionFollowupBubble({ message }: { message: Message }) {
  const addMessage = usePipelineStore(s => s.addMessage);
  const [acted, setActed] = useState(false);

  function handleAct() {
    setActed(true);
    addMessage({
      role: 'denario',
      type: 'text',
      content: "Noted — I'll factor this into the next revision.",
      stageId: message.stageId,
    });
  }

  return (
    <DenarioBubble message={message}>
      {!acted && message.actionLabel && (
        <div className={styles.suggestionFollowupActions}>
          <button className={styles.suggestionFollowupBtn} onClick={handleAct}>
            {message.actionLabel}
          </button>
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
    case 'suggestion-followup':
      return <SuggestionFollowupBubble message={message} />;
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

const NEAR_BOTTOM_PX = 120;
const PROGRAMMATIC_SCROLL_GUARD_MS = 700;

export function ConversationThread({ stageId }: ConversationThreadProps) {
  const messages = usePipelineStore(s => s.pipeline?.messages ?? []);
  const activeStageId = usePipelineStore(s => s.pipeline?.activeStageId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastMessageElRef = useRef<HTMLDivElement | null>(null);
  const followingRef = useRef(true);
  const programmaticUntilRef = useRef(0);
  const [showNewPill, setShowNewPill] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Input stage requires no track choice — auto-start it silently on mount.
  useEffect(() => {
    if (stageId !== 'input') return;
    const stage = usePipelineStore.getState().pipeline?.stages.input;
    if (stage?.status === 'idle') {
      startStage('input', 'standard');
    }
  }, [stageId]);

  // If a track was pre-selected on the homepage, stageRunner auto-advances
  // straight into Idea generation once Input completes — follow it.
  useEffect(() => {
    if (stageId !== 'input' || !activeStageId || activeStageId === 'input' || !projectId) return;
    navigate(`/project/${projectId}/stage/${activeStageId}`, { replace: true });
  }, [stageId, activeStageId, projectId, navigate]);

  function isNearBottom(): boolean {
    const el = viewportRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }

  function handleViewportScroll() {
    if (Date.now() < programmaticUntilRef.current) return; // ignore our own smooth-scroll animation
    followingRef.current = isNearBottom();
    if (followingRef.current) setShowNewPill(false);
  }

  function scrollToLatest(lastMsg: Message | undefined) {
    programmaticUntilRef.current = Date.now() + PROGRAMMATIC_SCROLL_GUARD_MS;
    if (lastMsg?.type === 'result-card' && lastMessageElRef.current) {
      lastMessageElRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    followingRef.current = true;
    setShowNewPill(false);
  }

  const prevLenRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length <= prevLenRef.current) {
      prevLenRef.current = messages.length;
      return;
    }
    prevLenRef.current = messages.length;

    const last = messages[messages.length - 1];
    if (last.role !== 'denario' || followingRef.current) {
      scrollToLatest(last);
    } else {
      setShowNewPill(true);
    }
  }, [messages.length]);

  return (
    <div className={styles.conversationThreadWrap}>
      <div
        className={styles.conversationViewport}
        ref={viewportRef}
        onScroll={handleViewportScroll}
      >
        <div className={styles.conversationStack}>
          {messages.map((msg, idx) => (
            <div key={msg.id} ref={idx === messages.length - 1 ? lastMessageElRef : undefined}>
              <MessageRenderer message={msg} isFirst={idx === 0} />
            </div>
          ))}
          <div ref={bottomRef} />
          <div className={styles.conversationSpacer} />
        </div>
      </div>

      {showNewPill && (
        <button
          className={styles.newResponsePill}
          onClick={() => scrollToLatest(messages[messages.length - 1])}
        >
          ↓ New response
        </button>
      )}

      <ComposeBar stageId={stageId} />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}
