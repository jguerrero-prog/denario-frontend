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
  RefereeResultData,
  KeywordsResultData,
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
    md.split(/\n{2,}/).find(p => p.trim().length > 80 && !p.startsWith('#')) ?? null
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
      ? { title: 'Scope constraint', body: scopeBody, suggestions: mockData.scopeNote?.suggestions }
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

function parseMethods(content: string, mock: StageResult): Partial<StageResult> {
  const mockData = mock.stageData as MethodsResultData;

  const overview =
    extractSection(content, 'Overview', 'Summary') ??
    firstParagraph(content) ??
    '';

  // Match "### N. Label" (backend default, 3 hashes) or "## Step N: Label" (legacy 2 hashes)
  const stepRe =
    /#{2,3}\s+(?:Step\s+)?(\d+)[.:]\s*(.+?)\s*\n([\s\S]*?)(?=\n#{2,3}\s+(?:Step\s+)?\d+[.:]|\n#{2,3}|\s*$)/gi;
  const steps: MethodsResultData['steps'] = [];
  let m: RegExpExecArray | null;
  while ((m = stepRe.exec(content)) !== null) {
    const body = m[3].trim();
    const toolMatch = body.match(/\*\*Tools?\*\*:\s*(.+)/i);
    const codeMatch = body.match(/```[a-z]*\n([\s\S]*?)```/);
    steps.push({
      n: m[1].padStart(2, '0'),
      label: m[2].trim(),
      tool: toolMatch ? toolMatch[1].trim() : '',
      description: body
        .replace(/\*\*Tools?\*\*:.*\n?/gi, '')
        .replace(/```[\s\S]*?```/g, '')
        .trim(),
      ...(codeMatch ? { codeSnippet: codeMatch[1].trim() } : {}),
    });
  }

  // Fallback: bold Roman-numeral headers "**I. Title**" (e.g. CRISPR-style output)
  if (steps.length === 0) {
    const boldRe = /^\*\*([IVX]+)\.\s+([^*]+?)\*\*\s*\n([\s\S]*?)(?=^\*\*[IVX]+\.|\s*$)/gim;
    let idx = 0;
    while ((m = boldRe.exec(content)) !== null) {
      idx++;
      const body = m[3].trim();
      const toolMatch = body.match(/\*\*Tools?\*\*:\s*(.+)/i);
      const codeMatch = body.match(/```[a-z]*\n([\s\S]*?)```/);
      steps.push({
        n: String(idx).padStart(2, '0'),
        label: m[2].trim(),
        tool: toolMatch ? toolMatch[1].trim() : '',
        description: body
          .replace(/\*\*Tools?\*\*:.*\n?/gi, '')
          .replace(/```[\s\S]*?```/g, '')
          .trim(),
        ...(codeMatch ? { codeSnippet: codeMatch[1].trim() } : {}),
      });
    }
  }

  const stageData: MethodsResultData = {
    ...mockData,
    overview,
    steps: steps.length > 0 ? steps : mockData.steps,
  };

  return {
    title: extractTitle(content) ?? undefined,
    content: overview,
    stageData,
  };
}

function parseAnalysis(content: string, mock: StageResult): Partial<StageResult> {
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

  const stageData: AnalysisResultData = {
    ...mockData,
    narrativeFindings: narrative ?? '',
    plots: plots.length > 0 ? plots : [],
    totalPlots: plots.length,
    selfHeals: selfHealMatch ? parseInt(selfHealMatch[1]) : 0,
    statsGrid,
  };

  return {
    title: extractTitle(content) ?? undefined,
    content: narrative ?? content.slice(0, 400),
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

  const abstractMatch = content.match(
    /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/
  );
  const abstract = abstractMatch
    ? abstractMatch[1].replace(/%[^\n]*/g, '').trim()
    : mockData.abstract;

  // Count unique \cite{...} keys
  const citeKeys = new Set(
    [...content.matchAll(/\\cite(?:\[[^\]]*\])?\{([^}]+)\}/g)]
      .flatMap(m => m[1].split(',').map(k => k.trim()))
  );
  const citations = citeKeys.size > 0 ? citeKeys.size : mockData.citations;

  // Strip LaTeX for plain title
  const rawTitle = extractTitle(content.replace(/\\[a-z]+\{([^}]*)\}/gi, '$1'));

  const stageData: PaperResultData = {
    ...mockData,
    abstract: abstract ?? mockData.abstract,
    citations,
  };

  return {
    title: rawTitle ?? undefined,
    content: abstract ?? undefined,
    tags: ['LaTeX', `${citations} citations`],
    stageData,
  };
}

function parseLiterature(content: string, mock: StageResult): Partial<StageResult> {
  const mockData = mock.stageData as LiteratureResultData;

  // Count numbered list items as papers
  const numbered = content.split('\n').filter(l => /^\d+\./.test(l.trim()));
  const totalScanned = numbered.length > 0 ? numbered.length : mockData.totalScanned;

  // Extract studies with overlap percentages: "94% — Title (venue)"
  const studyRe = /(\d+)%\s*[—–-]\s*(.+?)(?:\((.+?)\))?$/gm;
  const highOverlapStudies: LiteratureResultData['highOverlapStudies'] = [];
  let m: RegExpExecArray | null;
  while ((m = studyRe.exec(content)) !== null && highOverlapStudies.length < 6) {
    highOverlapStudies.push({
      pct: `${m[1]}%`,
      title: m[2].trim(),
      venue: m[3]?.trim() ?? '',
    });
  }

  const stageData: LiteratureResultData = {
    ...mockData,
    totalScanned,
    highOverlapStudies:
      highOverlapStudies.length > 0 ? highOverlapStudies : mockData.highOverlapStudies,
  };

  return {
    title: extractTitle(content) ?? undefined,
    content: firstParagraph(content) ?? undefined,
    tags: totalScanned > 0 ? [`${totalScanned} papers`] : [],
    stageData,
  };
}

function parseReferee(content: string, mock: StageResult): Partial<StageResult> {
  const mockData = mock.stageData as RefereeResultData;

  const verdictText =
    extractSection(content, 'Verdict', 'Recommendation', 'Summary') ??
    mockData.verdict.recommendation;

  // Determine verdict chip from text
  let chip = 'Revision Required';
  const lower = verdictText.toLowerCase();
  if (lower.includes('accept') && !lower.includes('major')) chip = 'Minor Revision';
  else if (lower.includes('major')) chip = 'Major Revision';
  else if (lower.includes('reject')) chip = 'Reject';

  // Extract reviewer sections: "## Reviewer A / Reviewer 1 / RC1"
  const reviewerRe =
    /##\s+(?:Reviewer\s+([A-Z\d]+)|#?(RC\d+))\s*\n([\s\S]*?)(?=\n##|$)/gi;
  const comments: RefereeResultData['comments'] = [];
  let m: RegExpExecArray | null;
  while ((m = reviewerRe.exec(content)) !== null) {
    const label = m[1] ?? m[2];
    const body  = m[3].trim();
    const severity = /major/i.test(body) ? 'Major' : 'Minor';
    comments.push({
      id: `#RC${label}`,
      label: `${severity} · Reviewer ${label}`,
      text: body,
      action: 'Address in manuscript →',
    });
  }

  const stageData: RefereeResultData = {
    ...mockData,
    verdict: { recommendation: verdictText, chip },
    comments: comments.length > 0 ? comments : mockData.comments,
  };

  return {
    title: extractTitle(content) ?? undefined,
    content: verdictText,
    stageData,
  };
}

function parseKeywords(content: string, mock: StageResult): Partial<StageResult> {
  const mockData = mock.stageData as KeywordsResultData;

  // Each "## Heading" section → keyword group
  const sectionRe = /##\s+(.+?)\s*\n([\s\S]*?)(?=\n##|$)/gi;
  const groups: KeywordsResultData['groups'] = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(content)) !== null) {
    const terms = (m[2].match(/[-*]\s+(.+)/g) ?? []).map(t =>
      t.replace(/^[-*]\s+/, '').trim()
    );
    if (terms.length > 0) groups.push({ heading: m[1].trim(), terms });
  }

  const stageData: KeywordsResultData = {
    ...mockData,
    groups: groups.length > 0 ? groups : mockData.groups,
  };

  return {
    title: extractTitle(content) ?? undefined,
    content: undefined,
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
): StageResult {
  const durationLabel = fmtDuration(durationSec) ?? mock.durationLabel;

  if (!rawContent) return { ...mock, title: undefined, content: '', tags: [], stats: {}, durationLabel, generatedAt: Date.now() };

  let parsed: Partial<StageResult> = {};
  try {
    switch (stageId) {
      case 'idea':       parsed = parseIdea(rawContent, mock);       break;
      case 'methods':    parsed = parseMethods(rawContent, mock);    break;
      case 'analysis':   parsed = parseAnalysis(rawContent, mock);   break;
      case 'paper':      parsed = parsePaper(rawContent, mock);      break;
      case 'literature': parsed = parseLiterature(rawContent, mock); break;
      case 'referee':    parsed = parseReferee(rawContent, mock);    break;
      case 'keywords':   parsed = parseKeywords(rawContent, mock);   break;
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
