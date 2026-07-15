export type StageId =
  | 'input'
  | 'idea'
  | 'methods'
  | 'analysis'
  | 'paper'
  | 'literature'
  | 'referee'
  | 'keywords';

export type StageStatus = 'locked' | 'idle' | 'running' | 'complete' | 'error';
export type Track = 'standard' | 'rigorous';

// ── Model configuration ────────────────────────────────────────────────────────

export type Provider = 'openai' | 'anthropic' | 'google';

export interface ModelConfig {
  provider: Provider;
  modelId: string;
}

// ── Messages — the unified conversation thread ─────────────────────────────────

export type MessageRole = 'user' | 'denario';

export type MessageType =
  | 'text'                 // plain chat bubble
  | 'stage-prompt'         // Denario opens a stage with action choices
  | 'status'               // ephemeral cycling status (running state)
  | 'result-card'          // stage output (idea.md, method.md, etc.)
  | 'suggestion-followup'  // Denario elaborates on a clicked scope-constraint suggestion
  | 'system';              // pipeline events ("Moving to Stage 2…")

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  stageId?: StageId;    // which stage this message belongs to
  track?: Track;        // set on result-card messages
  actionLabel?: string; // action button label — used by 'suggestion-followup'
  timestamp: number;
}

// ── Stage result data (per-stage structured payload) ──────────────────────────

export interface IdeaSuggestion {
  id: string;
  label: string;
  actionable: boolean;      // false = requires the user to bring new data/evidence
  followUpMessage?: string; // Denario's elaboration, shown as a new turn (actionable only)
  actionLabel?: string;     // action button label on that follow-up turn (actionable only)
}

export interface IdeaResultData {
  kind: 'idea';
  hypothesis: string;
  scopeNote?: { title: string; body: string; suggestions?: IdeaSuggestion[] } | null;
  researchFraming?: string;
  methodologyTags: string[];
  loopLog: string[];
  stageOutput: string;
  meta: { track: string; iterations: number; duration: string };
}

export interface MethodsResultData {
  kind: 'methods';
  overview: string;
  steps: Array<{
    n: string;
    label: string;
    tool: string;
    description: string;
    codeSnippet?: string;
  }>;
}

export interface AnalysisResultData {
  kind: 'analysis';
  plots: string[];
  totalPlots: number;
  selfHeals: number;
  narrativeFindings: string;
  statsGrid: {
    pearsonR: string;
    spearmanRho: string;
    r2: string;
    pValue: string;
  };
  generatedFiles: Array<{ name: string; size: string; type: 'py' | 'md' | 'dir' }>;
}

export interface PaperResultData {
  kind: 'paper';
  texFile: { name: string; size: string };
  pdfFile: { name: string; size: string; pages: number };
  citations: number;
  journal: string;
  abstract: string;
}

export interface LiteratureResultData {
  kind: 'literature';
  totalScanned: number;
  overlapCounts: { high: number; gaps: number; conflicts: number };
  highOverlapStudies: Array<{ pct: string; title: string; venue: string }>;
  suggestions: Array<{ text: string; action: string }>;
}

export interface RefereeResultData {
  kind: 'referee';
  verdict: { recommendation: string; chip: string };
  comments: Array<{ id: string; label: string; text: string; action: string }>;
}

export interface KeywordsResultData {
  kind: 'keywords';
  groups: Array<{ heading: string; terms: string[] }>;
}

export type StageResultData =
  | IdeaResultData
  | MethodsResultData
  | AnalysisResultData
  | PaperResultData
  | LiteratureResultData
  | RefereeResultData
  | KeywordsResultData;

// ── Stage result ───────────────────────────────────────────────────────────────

export interface StageResult {
  stageId: StageId;
  track: Track;
  file: string;         // e.g. 'idea.md'
  title?: string;       // heading for the result card
  content: string;      // main body text
  tags?: string[];
  stats?: Record<string, string>;   // e.g. { 'R²': '0.718', 'p': '<0.001' }
  durationLabel: string;            // e.g. '1 min 12 sec'
  generatedAt: number;
  stageData?: StageResultData;
}

// ── Stage ─────────────────────────────────────────────────────────────────────

export interface Stage {
  id: StageId;
  status: StageStatus;
  track?: Track;
  models: Record<string, ModelConfig>;  // role key → model
  params: Record<string, string | number | boolean>;  // stage-specific config
  result?: StageResult;
  error?: string;
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export interface InputFile {
  name: string;
  size: string;
}

export interface Pipeline {
  id: string;
  name: string;
  workspace: string;
  inputFile?: InputFile;
  inputText: string;
  preferredTools: string;
  mode: 'pipeline' | 'modular';
  initialTrack?: Track;  // track chosen on the homepage before the pipeline was created
  stages: Record<StageId, Stage>;
  activeStageId: StageId;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
