import type { StageId, ModelConfig } from '../types/pipeline';

// ── Stage-specific parameter fields ───────────────────────────────────────────

export type ParamFieldType = 'select' | 'toggle' | 'number' | 'text';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ParamField {
  key: string;
  label: string;
  type: ParamFieldType;
  default: string | number | boolean;
  options?: SelectOption[];  // for 'select'
  min?: number;              // for 'number'
  max?: number;              // for 'number'
  placeholder?: string;     // for 'text'
  tooltip?: string;         // optional hover explanation
}

// ── Model options available in all dropdowns ───────────────────────────────────

export interface ModelGroup {
  provider: string;
  models: string[];
}

export const MODEL_OPTIONS: ModelGroup[] = [
  { provider: 'OPENAI',    models: ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o3-mini'] },
  { provider: 'ANTHROPIC', models: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4'] },
  { provider: 'GOOGLE',    models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
];

// ── Per-stage model roles ──────────────────────────────────────────────────────

export interface ModelRole {
  key: string;    // store key, e.g. 'idea_maker'
  label: string;  // display label, e.g. 'Idea Maker Model'
  default: ModelConfig;
}

export interface StageConfigEntry {
  id: StageId;
  label: string;          // full label, e.g. 'Input Prompt'
  shortLabel: string;     // sidebar label
  outputFile: string;     // e.g. 'idea.md'
  modelRoles: ModelRole[];
  paramFields: ParamField[];  // stage-specific non-model config
  denarioOpener: string;  // Denario's opening message for this stage
}

export const STAGE_CONFIG: Record<StageId, StageConfigEntry> = {
  input: {
    id: 'input',
    label: 'Input Prompt',
    shortLabel: 'Input Prompt',
    outputFile: 'workspace',
    modelRoles: [
      {
        key: 'summarizer',
        label: 'Summarizer Model',
        default: { provider: 'openai', modelId: 'gpt-4.1' },
      },
      {
        key: 'formatter',
        label: 'Formatter Model',
        default: { provider: 'openai', modelId: 'o3-mini' },
      },
    ],
    paramFields: [],
    denarioOpener:
      'Research scope captured. For a submission-quality study, Standard is the stronger choice — the adversarial loop stress-tests the hypothesis before you commit to it. Fast Track works for exploratory work. Which would you prefer?',
  },

  idea: {
    id: 'idea',
    label: 'Idea',
    shortLabel: 'Idea',
    outputFile: 'idea.md',
    modelRoles: [
      {
        key: 'idea_maker',
        label: 'Idea Maker Model',
        default: { provider: 'openai', modelId: 'gpt-4.1' },
      },
      {
        key: 'idea_hater',
        label: 'Idea Hater Model',
        default: { provider: 'anthropic', modelId: 'claude-sonnet-4' },
      },
    ],
    paramFields: [
      {
        key: 'total_iterations',
        label: 'Adversarial iterations',
        type: 'number',
        default: 3,
        min: 1,
        max: 10,
        tooltip: 'How many rounds the idea_maker and idea_hater agents debate the hypothesis. More iterations stress-test the idea further but take longer.',
      },
    ],
    denarioOpener:
      'Hypothesis locked from Stage 1. The idea_maker will generate a testable hypothesis from your dataset and the idea_hater will stress-test it. Ready to begin?',
  },

  methods: {
    id: 'methods',
    label: 'Methods',
    shortLabel: 'Methods',
    outputFile: 'method.md',
    modelRoles: [
      {
        key: 'planner',
        label: 'Planner Model',
        default: { provider: 'openai', modelId: 'gpt-4.1' },
      },
      {
        key: 'plan_reviewer',
        label: 'Plan Reviewer Model',
        default: { provider: 'anthropic', modelId: 'claude-sonnet-4' },
      },
      {
        key: 'method_generator',
        label: 'Method Generator Model',
        default: { provider: 'google', modelId: 'gemini-2.5-pro' },
      },
    ],
    paramFields: [],
    denarioOpener:
      'Hypothesis approved. The Methods sub-swarm will translate it into a concrete technical roadmap. The planner drafts, the reviewer critiques, and the method generator finalises. Ready?',
  },

  analysis: {
    id: 'analysis',
    label: 'Analysis',
    shortLabel: 'Analysis',
    outputFile: 'results.md',
    modelRoles: [
      {
        key: 'engineer',
        label: 'Engineer Model',
        default: { provider: 'google', modelId: 'gemini-2.5-pro' },
      },
      {
        key: 'researcher',
        label: 'Researcher Model',
        default: { provider: 'openai', modelId: 'gpt-4.1' },
      },
    ],
    paramFields: [],
    denarioOpener:
      'Methods approved. The engineer will write and execute Python against your dataset in a sandboxed environment. If it hits an error, it self-heals. Ready to run the analysis?',
  },

  paper: {
    id: 'paper',
    label: 'Paper',
    shortLabel: 'Paper',
    outputFile: 'manuscript.tex',
    modelRoles: [
      {
        key: 'writer',
        label: 'Writing Model',
        default: { provider: 'anthropic', modelId: 'claude-opus-4' },
      },
    ],
    paramFields: [
      {
        key: 'journal',
        label: 'Journal format',
        type: 'select',
        default: 'NONE',
        options: [
          { value: 'NONE', label: 'Standard (no journal)' },
          { value: 'AAS',  label: 'AAS — Astrophysical Journal' },
          { value: 'APS',  label: 'APS — Physical Review' },
          { value: 'ICML', label: 'ICML' },
          { value: 'JHEP', label: 'JHEP / JCAP' },
          { value: 'NeurIPS', label: 'NeurIPS' },
          { value: 'PASJ', label: 'PASJ' },
        ],
      },
      {
        key: 'discipline',
        label: 'Researcher discipline',
        type: 'text',
        default: '',
        placeholder: 'e.g. astrophysicists',
      },
      {
        key: 'add_citations',
        label: 'Add citations',
        type: 'toggle',
        default: true,
      },
      {
        key: 'cmbagent_keywords',
        label: 'CMBagent keywords',
        type: 'toggle',
        default: false,
        tooltip: 'Uses the CMBagent multi-agent system to match keywords against the official AAS controlled vocabulary. Best suited for astronomy papers.',
      },
      {
        key: 'num_keywords',
        label: 'Keyword count',
        type: 'number',
        default: 10,
        min: 1,
        max: 50,
      },
    ],
    denarioOpener:
      'Analysis complete. Ready to draft the manuscript. Which journal format should I target, and what is your discipline?',
  },

  literature: {
    id: 'literature',
    label: 'Literature Review',
    shortLabel: 'Literature Review',
    outputFile: 'literature_review.md',
    modelRoles: [
      {
        key: 'reviewer',
        label: 'Reviewer Model',
        default: { provider: 'openai', modelId: 'gpt-4.1' },
      },
    ],
    paramFields: [
      {
        key: 'mode',
        label: 'Search engine',
        type: 'select',
        default: 'semantic_scholar',
        options: [
          { value: 'semantic_scholar', label: 'Semantic Scholar' },
          { value: 'futurehouse',      label: 'FutureHouse' },
        ],
      },
      {
        key: 'max_iterations',
        label: 'Max search iterations',
        type: 'number',
        default: 7,
        min: 1,
        max: 20,
      },
      {
        key: 'num_papers',
        label: 'Papers per query',
        type: 'number',
        default: 10,
        min: 1,
        max: 50,
      },
    ],
    denarioOpener:
      'Ready to search Semantic Scholar and your uploaded references for overlapping prior work. This runs in parallel with the Paper stage.',
  },

  referee: {
    id: 'referee',
    label: 'Referee Report',
    shortLabel: 'Referee Report',
    outputFile: 'referee_report.md',
    modelRoles: [
      {
        key: 'referee',
        label: 'Referee Model',
        default: { provider: 'anthropic', modelId: 'claude-opus-4' },
      },
    ],
    paramFields: [
      {
        key: 'paper_version',
        label: 'Paper version to review',
        type: 'select',
        default: '1',
        options: [
          { value: '1', label: 'v1' },
          { value: '2', label: 'v2' },
          { value: '3', label: 'v3' },
          { value: '4', label: 'v4' },
        ],
      },
    ],
    denarioOpener:
      'I will simulate two independent peer reviewers and surface their comments and revision verdict. Ready?',
  },

  keywords: {
    id: 'keywords',
    label: 'Keywords',
    shortLabel: 'Keywords',
    outputFile: 'keywords.md',
    modelRoles: [
      {
        key: 'extractor',
        label: 'Extractor Model',
        default: { provider: 'openai', modelId: 'gpt-4o-mini' },
      },
    ],
    paramFields: [
      {
        key: 'kw_type',
        label: 'Keyword taxonomy',
        type: 'select',
        default: 'unesco',
        options: [
          { value: 'unesco', label: 'UNESCO' },
          { value: 'aas',    label: 'AAS — American Astronomical Society' },
          { value: 'aaai',   label: 'AAAI — AI / Computer Science' },
        ],
        tooltip: 'The controlled vocabulary used to standardise keywords. UNESCO covers general science; AAS is for astronomy; AAAI is for AI and computer science.',
      },
      {
        key: 'num_keywords',
        label: 'Keyword count',
        type: 'number',
        default: 10,
        min: 1,
        max: 50,
      },
    ],
    denarioOpener:
      'Final stage. I will extract and group keywords — Primary, Methodology, and Domain — from the manuscript.',
  },
};

export const STAGE_ORDER: StageId[] = [
  'input', 'idea', 'methods', 'analysis', 'paper', 'literature', 'referee', 'keywords',
];

export function nextStage(id: StageId): StageId | null {
  const idx = STAGE_ORDER.indexOf(id);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}
