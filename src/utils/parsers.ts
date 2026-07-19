// Best-effort markdown → StageResult parsers.
// Each parser extracts what it can from Denario's output files; unrecognised
// fields fall back to the mock result so rich cards always render.

import type {
  StageId,
  StageResult,
  Track,
  IdeaResultData,
  MethodsResultData,
  AnalysisResultData,
  PaperResultData,
  LiteratureResultData,
  StructuredLiteratureReview,
  RefereeResultData,
  StructuredRefereeReport,
  KeywordsResultData,
  StructuredKeywords,
} from '../types/pipeline';

// ── Markdown helpers ──────────────────────────────────────────────────────────

function extractTitle(md: string): string | null {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function extractSection(md: string, ...headings: string[]): string | null {
  for (const h of headings) {
    const re = new RegExp(`##\\s+${h}[:\\s]*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
    const m = md.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function firstParagraph(md: string): string | null {
  return (
    md.split(/\n{2,}/).find(p => {
      const t = p.trim();
      return t.length > 80 && !t.startsWith('#') && !t.startsWith('>');
    }) ?? null
  );
}

function extractQuoteLines(md: string): string[] {
  return md
    .split('\n')
    .filter(l => l.startsWith('> '))
    .map(l => l.slice(2).trim());
}

// Parse a ## Tags section written by the backend: "A, B, C" → ["A", "B", "C"]
// Returns null if the section is absent so callers can decide the fallback.
function extractTagsSection(md: string): string[] | null {
  const section = extractSection(md, 'Tags');
  if (!section) return null;
  const tags = section.split(',').map(t => t.trim()).filter(Boolean);
  return tags.length > 0 ? tags : null;
}

// ── Per-stage parsers ─────────────────────────────────────────────────────────

function parseIdea(content: string, mock: StageResult): Partial<StageResult> {
  const mockData = mock.stageData as IdeaResultData;

  const paras = content.split(/\n{2,}/);

  // Title: prefer # heading; fall back to a plain first-line title (single unwrapped line)
  const mdTitle = extractTitle(content);
  const plainTitle =
    !mdTitle && paras[0] && !paras[0].includes('\n') ? paras[0].trim() : null;
  const titleText = mdTitle ?? plainTitle;

  // Skip the plain-text title paragraph when searching for hypothesis body
  const bodyContent = plainTitle ? paras.slice(1).join('\n\n') : content;

  const hypothesis =
    extractSection(bodyContent, 'Hypothesis', 'Research Hypothesis', 'Research Question') ??
    firstParagraph(bodyContent) ??
    '';

  // Extract real sections — no mock fallback for domain-specific fields.
  // If the backend didn't emit a section, leave the field undefined so the UI hides it.
  const framing   = extractSection(bodyContent, 'Research Framing', 'Framing') ?? undefined;
  const scopeBody = extractSection(bodyContent, 'Scope', 'Limitations', 'Scope Note') ?? undefined;
  const loopLines = extractQuoteLines(content);
  const tags      = extractTagsSection(content) ?? [];

  const stageData: IdeaResultData = {
    ...mockData,
    hypothesis,
    researchFraming: framing,
    // suggestions: no backend support yet for tailored suggestions — reuse the
    // mock's placeholder set so the chip UI/design can be iterated on now.
    scopeNote: scopeBody
      ? { title: 'Constraint', body: scopeBody, suggestions: mockData.scopeNote?.suggestions }
      : null,
    // loopLog — adversarial loop internals are not surfaced in idea.md; hide rather than mock
    loopLog: loopLines.length > 0 ? loopLines : [],
    // methodologyTags — reuse the same tags the backend generated
    methodologyTags: tags.length > 0 ? tags : [],
    // stageOutput and meta are generic/non-domain — keep from mock
  };

  return {
    title: titleText ?? undefined,
    content: hypothesis,
    tags,
    stageData,
  };
}

// The Methods (and Analysis) stage emits schema-constrained structured data —
// see DenarioBackend's StructuredMethodology — so sections/substeps are read
// directly from `structured` rather than parsed out of markdown. `content`
// (the rendered methods.md) is only used here for the overview/title, and as
// a fallback to the mock when structured data isn't present (e.g. mid-migration
// or a backend that hasn't run the stage yet).
function parseMethods(
  content: string,
  mock: StageResult,
  structured?: Record<string, unknown> | null,
): Partial<StageResult> {
  const mockData = mock.stageData as MethodsResultData;

  const overview =
    extractSection(content, 'Overview', 'Summary') ??
    firstParagraph(content) ??
    '';

  const sections =
    structured && Array.isArray(structured.sections)
      ? (structured.sections as MethodsResultData['sections'])
      : mockData.sections;

  const stageData: MethodsResultData = { ...mockData, overview, sections };

  return {
    title: extractTitle(content) ?? undefined,
    content: overview,
    stageData,
  };
}

function parseAnalysis(
  content: string,
  mock: StageResult,
  structured?: Record<string, unknown> | null,
): Partial<StageResult> {
  const mockData = mock.stageData as AnalysisResultData;

  const pearsonR    = content.match(/Pearson\s+r\s*[=:≈]\s*([\d.]+)/i)?.[1];
  const spearmanRho = content.match(/Spearman\s+[ρrRho]+\s*[=:≈]\s*([\d.]+)/i)?.[1];
  const r2          = content.match(/R[²2]\s*[=:≈]\s*([\d.]+)/i)?.[1];
  const pRaw        = content.match(/p[- ]?(?:value)?\s*[=<≤]\s*([^\s,;)]+)/i)?.[1];
  const pValue      = pRaw ? (pRaw.includes('<') ? pRaw : `< ${pRaw}`) : undefined;

  const narrative =
    extractSection(content, 'Findings', 'Narrative', 'Results', 'Summary') ??
    firstParagraph(content) ??
    null;

  const plots = [...new Set([...content.matchAll(/\b[\w.-]+\.png\b/gi)].map(x => x[0]))];

  const selfHealMatch = content.match(/(\d+)\s+self[- ]heal/i);

  const statsGrid: AnalysisResultData['statsGrid'] = {
    pearsonR:    pearsonR    ?? '',
    spearmanRho: spearmanRho ?? '',
    r2:          r2          ?? '',
    pValue:      pValue      ?? '',
  };

  const tags: string[] = [];
  if (r2)     tags.push(`R² ${r2}`);
  if (pValue) tags.push(`p ${pValue}`);
  if (plots.length > 0) tags.push(`${plots.length} plots`);

  // structured (results.json, dynamically parsed by denario/results_parser.py
  // from the real markdown — not schema-constrained generation like Methods,
  // see structured_results.py's docstring) is the richer source when present;
  // the regex fields above stay as a fallback for projects generated before
  // this parser existed, so older results still render something reasonable.
  const parsedStructured = (structured as unknown as AnalysisResultData['structured']) ?? null;

  const stageData: AnalysisResultData = {
    ...mockData,
    narrativeFindings: narrative ?? '',
    plots: plots.length > 0 ? plots : [],
    totalPlots: plots.length,
    selfHeals: selfHealMatch ? parseInt(selfHealMatch[1]) : 0,
    statsGrid,
    structured: parsedStructured,
  };

  return {
    title: parsedStructured?.title ?? extractTitle(content) ?? undefined,
    content: parsedStructured?.summary || narrative || content.slice(0, 400),
    // Analysis's real output is a full long-form report (headers, tables,
    // a references section). `structured` (above) is preferred for
    // rendering when present; `rawContent` remains as a plain-text fallback
    // for older projects with no results.json sidecar yet.
    rawContent: content,
    tags,
    stats: {
      ...(r2        ? { 'R²': r2 }           : {}),
      ...(pValue    ? { 'p-value': pValue }   : {}),
      ...(pearsonR  ? { 'Pearson r': pearsonR } : {}),
    },
    stageData,
  };
}

function parsePaper(content: string, mock: StageResult): Partial<StageResult> {
  const mockData = mock.stageData as PaperResultData;

  // denario/api/runner.py hardcodes add_citations=False for the API path
  // today, so `citations` will realistically be 0 for now — that's accurate,
  // not a bug, and the UI should show it as such rather than padding with a
  // mock count. See DenarioBackend api/runner.py's paper branch.
  const abstractMatch = content.match(
    /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/
  );
  const abstract = abstractMatch
    ? abstractMatch[1].replace(/%[^\n]*/g, '').trim()
    : '';

  // Count unique \cite{...} keys
  const citeKeys = new Set(
    [...content.matchAll(/\\cite(?:\[[^\]]*\])?\{([^}]+)\}/g)]
      .flatMap(m => m[1].split(',').map(k => k.trim()))
  );
  const citations = citeKeys.size;

  // Strip LaTeX for plain title
  const rawTitle = extractTitle(content.replace(/\\[a-z]+\{([^}]*)\}/gi, '$1'));

  const stageData: PaperResultData = {
    ...mockData,
    abstract,
    citations,
  };

  return {
    title: rawTitle ?? undefined,
    content: abstract || content.slice(0, 400),
    // The real, unabridged manuscript.tex — no schema exists for LaTeX the
    // way Methods/Analysis have one, so the full page renders this directly
    // rather than the fabricated mock PDF/tex preview it used to show.
    rawContent: content,
    tags: citations > 0 ? ['LaTeX', `${citations} citations`] : ['LaTeX'],
    stageData,
  };
}

function parseLiterature(content: string, structured?: Record<string, unknown> | null): Partial<StageResult> {
  // structured (literature.json, written by DenarioBackend's
  // literature_parser.py) is the richer source when present — real
  // decision/papers/conclusion instead of a regex teaser. Older projects
  // generated before the sidecar existed simply have no `structured`, and
  // the full page falls back to raw markdown (see LiteratureFullPage.tsx).
  const parsedStructured = (structured as unknown as StructuredLiteratureReview | undefined) ?? null;

  const stageData: LiteratureResultData = { kind: 'literature', structured: parsedStructured };

  const tags: string[] = [];
  if (parsedStructured?.decision) tags.push(parsedStructured.decision);
  if (parsedStructured?.papers.length) tags.push(`${parsedStructured.papers.length} papers compared`);

  return {
    title: extractTitle(content) ?? undefined,
    content: parsedStructured?.assessment || firstParagraph(content) || undefined,
    // Real, unabridged literature_review.md — no fabricated overlap stats or
    // invented paper matches, just what the backend actually generated.
    rawContent: content,
    tags,
    stageData,
  };
}

function parseReferee(content: string, structured?: Record<string, unknown> | null): Partial<StageResult> {
  // structured (referee.json, written by DenarioBackend's referee_parser.py)
  // is the richer source when present — real score/sections instead of a
  // regex teaser. Older projects generated before the sidecar existed
  // simply have no `structured`, and the full page falls back to raw
  // markdown (see RefereeFullPage.tsx).
  const parsedStructured = (structured as unknown as StructuredRefereeReport | undefined) ?? null;

  const stageData: RefereeResultData = { kind: 'referee', structured: parsedStructured };

  const tags: string[] = [];
  if (parsedStructured?.score) tags.push(`Score: ${parsedStructured.score}`);

  const overallSection = parsedStructured?.sections.find(s => /overall|assessment|summary/i.test(s.title));

  return {
    title: extractTitle(content) ?? undefined,
    content: overallSection?.body || firstParagraph(content) || undefined,
    // Real, unabridged referee.md — no fabricated verdict chip or invented
    // per-reviewer comment cards, just what the backend actually generated.
    rawContent: content,
    tags,
    stageData,
  };
}

function parseKeywords(content: string, structured?: Record<string, unknown> | null): Partial<StageResult> {
  // structured (keywords.json, written by DenarioBackend's
  // keywords_parser.py) is the source of truth when present — keywords.md's
  // format is deterministic (see structured_keywords.py's docstring), so
  // there's no fabricated fallback grouping the way other stages have one.
  const parsedStructured = (structured as unknown as StructuredKeywords | undefined) ?? null;

  const stageData: KeywordsResultData = { kind: 'keywords', structured: parsedStructured };

  const count = parsedStructured?.keywords.length ?? 0;

  return {
    title: extractTitle(content) ?? undefined,
    content: parsedStructured?.keywords.map(k => k.term).join(', ') || undefined,
    rawContent: content,
    tags: count > 0 ? [`${count} keywords`] : [],
    stageData,
  };
}

// ── Duration formatter ────────────────────────────────────────────────────────

function fmtDuration(sec: number | null): string | null {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseBackendResult(
  stageId:     StageId,
  track:       Track,
  rawContent:  string | null,
  durationSec: number | null,
  mock:        StageResult,
  structured?: Record<string, unknown> | null,
): StageResult {
  const durationLabel = fmtDuration(durationSec) ?? mock.durationLabel;

  if (!rawContent) return { ...mock, title: undefined, content: '', tags: [], stats: {}, durationLabel, generatedAt: Date.now() };

  let parsed: Partial<StageResult> = {};
  try {
    switch (stageId) {
      case 'idea':       parsed = parseIdea(rawContent, mock);       break;
      case 'methods':    parsed = parseMethods(rawContent, mock, structured); break;
      case 'analysis':   parsed = parseAnalysis(rawContent, mock, structured); break;
      case 'paper':      parsed = parsePaper(rawContent, mock);      break;
      case 'literature': parsed = parseLiterature(rawContent, structured); break;
      case 'referee':    parsed = parseReferee(rawContent, structured); break;
      case 'keywords':   parsed = parseKeywords(rawContent, structured); break;
    }
  } catch {
    // leave parsed empty — spread over mock below
  }

  return {
    ...mock,
    durationLabel,
    generatedAt: Date.now(),
    ...parsed,
  };
}
