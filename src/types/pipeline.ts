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
  | 'log-card'             // collapsible adversarial-loop transcript (Idea stage)
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
  // ROADMAP.md tickets 6.5/6.7/6.9 — set when the assistant proposed an
  // action. Never auto-triggered; DenarioBubble renders a confirm/dismiss
  // pair that calls the existing startStage() (run), approveStage-with-
  // edited-content (edit), or applyPlotRegeneration (plot) mechanism only
  // when the researcher confirms.
  proposedAction?:
    | { type: 'run'; stageId: StageId }
    | { type: 'edit'; stageId: StageId; oldContent: string; newContent: string; newStructured: Record<string, unknown> | null }
    | { type: 'plot'; stageId: StageId; plotFilename: string; oldPlotPath: string; newPlotPath: string; description: string };
}

// ── Stage result data (per-stage structured payload) ──────────────────────────

export interface IdeaSuggestion {
  id: string;
  label: string;
  actionable: boolean;      // false = requires the user to bring new data/evidence
  followUpMessage?: string; // Denario's elaboration, shown as a new turn (actionable only)
  actionLabel?: string;     // action button label on that follow-up turn (actionable only)
}

export interface IdeaTranscriptRound {
  round: number;
  speaker: 'idea_maker' | 'idea_hater';
  content: string;
}

export interface IdeaResultData {
  kind: 'idea';
  hypothesis: string;
  scopeNote?: { title: string; body: string; suggestions?: IdeaSuggestion[] } | null;
  researchFraming?: string;
  methodologyTags: string[];
  transcript: IdeaTranscriptRound[];
  stageOutput: string;
  meta: { track: string; iterations: number; duration: string };
  // Rigorous-track only (ticket 2.2) — mutually exclusive with `transcript`
  // in practice: idea.log (Fast track) produces `transcript`, a Rigorous
  // run produces this instead. Reuses MethodsPlanningTurn/
  // MethodsExecutionStep as-is (generalized in ticket 2.1) rather than
  // separate Idea-specific types — same real shape, confirmed against a
  // real Rigorous-track Idea run (planner/plan_reviewer planning debate,
  // idea_maker/idea_hater alternating per execution step).
  planningLog?: MethodsPlanningTurn[];
  executionLog?: MethodsExecutionStep[];
}

export interface MethodPoint {
  text: string;
}

export interface MethodSubStep {
  number: string;         // e.g. '6.4'
  label: string;          // e.g. 'Correlation Analysis'
  body?: string | null;   // single inline explanation — mutually exclusive with `points`
  points: MethodPoint[];  // explanatory bullet points — mutually exclusive with `body`
  code?: string | null;   // optional short code snippet
}

export interface MethodSection {
  number: string;  // e.g. '6'
  title: string;   // e.g. 'Statistical Analysis'
  substeps: MethodSubStep[];
}

// Rigorous-track-only reasoning log shape — see REASONING_LOG_TICKETS.md.
// Two structurally different sources, not one flat transcript like Idea's
// Fast-track log: a short two-voice debate over the plan itself, then a
// sequential list of steps where a single agent narrates each planned
// sub-task in turn (no second voice, no critique). Despite the name, this
// isn't Methods-exclusive (ticket 2.1 generalized it) — any stage whose
// Rigorous track produces this shape reuses it as-is: Methods' own
// planner/plan_reviewer debate + researcher steps, and Idea-Rigorous's
// idea_maker/idea_hater debate + per-step agent (ticket 2.2, since
// final_plan.json's own `sub_task_agent` field varies per step there,
// unlike Methods' always-`researcher` steps). `speaker`/agent values are
// real cmbagent agent names, not a fixed Methods-only pair.
export interface MethodsPlanningTurn {
  speaker: string;
  content: string;
}

export interface MethodsExecutionStep {
  step: number;
  title: string;    // the plan's sub_task text for this step (final_plan.json)
  content: string;  // the executing agent's real markdown answer for this step
}

export interface MethodsResultData {
  kind: 'methods';
  overview: string;
  sections: MethodSection[];
  planningLog: MethodsPlanningTurn[];
  executionLog: MethodsExecutionStep[];
}

export interface ResultTable {
  caption?: string | null;
  columns: string[];
  rows: string[][];
}

export interface ResultFinding {
  label: string;
  detail: string;
}

export interface ResultSubsection {
  number?: string | null;  // e.g. '1.1' — absent when the source doc doesn't number subsections
  title: string;
  body: string;
}

export interface ResultSection {
  number?: string | null;  // e.g. '3' — absent when the source doc doesn't number sections
  title: string;
  body: string;
  subsections: ResultSubsection[];
  findings: ResultFinding[];
  tables: ResultTable[];
}

export interface ResultArtifactCategory {
  label: string;
  files: string[];
}

// Dynamically parsed from real results.md (denario/results_parser.py) — not
// schema-constrained LLM generation like Methods, since Analysis's real
// output varies more than a fixed schema should force it into. Absent
// entirely on older projects generated before this parser existed.
export interface StructuredResults {
  title: string;
  summary: string;
  sections: ResultSection[];
  artifacts: ResultArtifactCategory[];
  note?: string | null;
}

export interface AnalysisResultData {
  kind: 'analysis';
  plots: string[];
  // Keyed by the bare filename in `plots`. Sourced from the real report's
  // own per-file labels when present, never fabricated (see
  // derivePlotCaptions in utils/parsers.ts).
  plotCaptions: Record<string, string>;
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
  structured?: StructuredResults | null;
  // ROADMAP.md ticket 4.4 — real CSVs promoted by 4.1 to
  // input_files/analysis_data/, fetched via a real file listing (not
  // parsed from results.md prose, unlike `plots` above) — see
  // fetchAnalysisDataFiles in utils/stageRunner.ts. Bare filenames.
  dataFiles?: string[];
}

export interface PaperResultData {
  kind: 'paper';
  citations: number;
  abstract: string;
}

// Mirrors DenarioBackend's denario/structured_literature.py — populated by
// best-effort parsing of literature.md (see literature_parser.py), not
// schema-constrained generation, so every field beyond `assessment` is
// optional and a differently-shaped literature.md degrades gracefully.
export interface LiteraturePaper {
  title: string;
  url?: string | null;
  similarities?: string | null;
  differences?: string | null;
}

export interface StructuredLiteratureReview {
  decision?: string | null;
  assessment: string;
  papers: LiteraturePaper[];
  conclusion?: string | null;
}

// Mirrors DenarioBackend's denario/papers_log_parser.py — the full,
// deduplicated set of papers Semantic Scholar returned across every query
// round of the novelty-check loop (denario/langgraph_agents/literature.py),
// not just the handful the LLM chose to discuss in literature.md. Distinct
// shape from LiteraturePaper: raw search metadata (authors/abstract), not a
// novelty comparison (no similarities/differences to fabricate).
export interface SearchedPaper {
  title: string;
  year?: string | null;
  authors: string;
  abstract: string;
  url?: string | null;
}

export interface LiteratureResultData {
  kind: 'literature';
  structured?: StructuredLiteratureReview | null;
  searchedPapers: SearchedPaper[];
}

// Mirrors DenarioBackend's denario/structured_referee.py — populated by
// best-effort parsing of referee.md (see referee_parser.py), not
// schema-constrained generation, so every field beyond a section's `title`
// is optional and a differently-shaped referee.md degrades gracefully.
export interface RefereePoint {
  heading?: string | null;
  body: string;
}

export interface RefereeSection {
  title: string;
  body: string;
  points: RefereePoint[];
}

export interface StructuredRefereeReport {
  score?: string | null;
  score_note?: string | null;
  sections: RefereeSection[];
}

export interface RefereeResultData {
  kind: 'referee';
  structured?: StructuredRefereeReport | null;
}

// Mirrors DenarioBackend's denario/structured_keywords.py — keywords.md's
// format is deterministic (a plain `- term` or `- [term](url)` bullet list,
// see that module's docstring), not fabricated groupings like the old
// "Primary/Methodology/Domain" categories this UI used to invent.
export interface KeywordEntry {
  term: string;
  url?: string | null;
}

export interface StructuredKeywords {
  keywords: KeywordEntry[];
}

export interface KeywordsResultData {
  kind: 'keywords';
  structured?: StructuredKeywords | null;
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
  content: string;      // main body text (short teaser for the compact card)
  rawContent?: string;  // full, unabridged backend markdown — for stages (e.g.
                         // Analysis) whose real output is a long-form document
                         // that a single short teaser paragraph can't represent
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
  // ROADMAP.md ticket 6.6 — set when an upstream stage has been edited/rerun
  // since this stage was generated. staleBecause names which upstream
  // stage(s). Detection only — surfaced as a nudge, never auto-refreshed.
  stale?: boolean;
  staleBecause?: StageId[];
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
  inputFiles?: InputFile[];
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
