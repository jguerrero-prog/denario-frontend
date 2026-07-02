import { usePipelineStore } from '../store/pipelineStore';
import { useConfigStore } from '../store/configStore';
import { api } from '../api/client';
import { parseBackendResult } from './parsers';
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

// ── Module-level run state ────────────────────────────────────────────────────

const activeTimers  = new Map<StageId, ReturnType<typeof setTimeout>>();
const statusMsgIds  = new Map<StageId, string>();
// Cleanup functions returned by api.streamStage (close the EventSource)
const sseCleanups   = new Map<StageId, () => void>();

// ── Mock results ──────────────────────────────────────────────────────────────

function buildMockResult(stageId: StageId, track: Track): StageResult {
  const fast = track === 'fast';
  const results: Record<StageId, StageResult> = {
    input: {
      stageId, track, file: 'workspace',
      title: 'Research Scope Configured',
      content: 'Dataset and research question validated. Tools and preferred libraries recorded.',
      tags: ['CO2', 'Temperature', 'Time-series'],
      durationLabel: fast ? '11 sec' : '24 sec',
      generatedAt: Date.now(),
    },
    idea: {
      stageId, track, file: 'idea.md',
      title: 'Temporal Correlation Between Atmospheric CO₂ Concentration and Surface Temperature Anomalies: A 5-Year Constrained Observational Study (2019–2024)',
      content: 'This study tests whether a statistically significant positive correlation exists between rising atmospheric CO₂ concentrations and concurrent surface temperature anomalies using Pearson and Spearman correlation coefficients alongside OLS regression (statsmodels).',
      tags: ['Time-series regression', 'OLS · Pearson · Spearman'],
      durationLabel: fast ? '1 min 08 sec' : '2 min 41 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'idea',
        hypothesis: 'This study investigates whether rising atmospheric CO₂ concentrations (ppm) serve as a statistically significant predictor of concurrent surface temperature anomalies (°C) across a constrained 5-year observation window (2019–2024). The null hypothesis posits no significant relationship between CO₂ concentration and temperature anomaly. The alternative hypothesis posits that CO₂ concentration is a statistically significant predictor of surface temperature anomaly at p < 0.05 significance.',
        scopeNote: {
          title: 'Scope constraint flagged by adversarial review',
          body: 'The 5-year observation window (2019–2024) is acknowledged as a scope limitation. Findings should be framed as period-specific correlations rather than multi-decadal climate trends. This constraint was identified by the idea_hater agent during the adversarial loop and incorporated into the hypothesis framing before finalisation.',
        },
        researchFraming: 'The study targets the climate science domain, focusing on empirical validation within the Python scientific stack (pandas, statsmodels) to maintain full reproducibility. The 2019–2024 observation window captures a post-pandemic emissions recovery period of particular scientific interest, and the period-specific framing aligns with the dataset boundaries available.',
        methodologyTags: ['Time-series correlation analysis', 'OLS · Pearson · Spearman · Scope-constrained'],
        loopLog: [
          '> Iteration 1: idea_maker proposed CO₂-temperature correlation (2019–2024)',
          '> Iteration 1: idea_hater flagged narrow observation window as limitation',
          '> Iteration 2: idea_maker refined — added scope-constrained framing',
          '> Iteration 2: idea_hater accepted with note on multi-decadal caution',
          fast ? '> Iteration 3: planner finalised research question' : '> Iteration 3: idea_maker strengthened statistical methodology rationale',
          fast ? '> Hypothesis locked · idea.md committed' : '> Iteration 4: formatter standardised output structure',
          fast ? null : '> Hypothesis locked · idea.md committed',
        ].filter(Boolean) as string[],
        stageOutput: 'idea.md saved · Stage 3 (Methods) unlocked',
        meta: { track: fast ? 'Fast Track' : 'Standard', iterations: fast ? 3 : 4, duration: fast ? '1m 08s' : '6m 42s' },
      } satisfies IdeaResultData,
    },
    methods: {
      stageId, track, file: 'method.md',
      title: 'Technical Methodology: CO₂-Temperature Correlation Analysis',
      content: 'Five-step pipeline: ingest and validate CSVs, resample and align series, generate time-series plots, run Pearson/Spearman/OLS correlation tests, then export results and coefficients to results.md.',
      tags: ['pandas · statsmodels', '5 steps · est. 2 min runtime'],
      durationLabel: fast ? '58 sec' : '2 min 12 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'methods',
        overview: 'This methodology outlines the complete analytical framework for investigating the temporal correlation between atmospheric CO₂ concentration (ppm) and surface temperature anomalies (°C) across a five-year observation window (2019–2024). The pipeline applies a time-series regression approach using pandas and statsmodels.',
        steps: [
          {
            n: '01',
            label: 'Data Ingestion & Validation',
            tool: 'pandas',
            description: 'Load co2_readings.csv and temp_anomalies.csv using pd.read_csv(). Assert column dtypes, validate date index continuity 2019–2024. Flag null values and log row count.',
            codeSnippet: "df_co2 = pd.read_csv('co2_readings.csv', parse_dates=['date'], index_col='date')",
          },
          {
            n: '02',
            label: 'Preprocessing & Alignment',
            tool: 'pandas',
            description: "Resample both series to monthly frequency using .resample('MS').mean(). Apply linear interpolation for gaps under 3 consecutive months. Normalise units — CO₂ as ppm deviation from 415ppm baseline.",
          },
          {
            n: '03',
            label: 'Exploratory Time-Series Analysis',
            tool: 'matplotlib',
            description: 'Generate dual-axis time-series plot. Compute rolling 12-month Pearson correlation window. Export as co2_temp_timeseries.png at 300dpi.',
          },
          {
            n: '04',
            label: 'Statistical Correlation Testing',
            tool: 'statsmodels · scipy',
            description: 'Run scipy.stats.pearsonr and spearmanr. Fit OLS regression using statsmodels. Evaluate p-values, R², and residual plots for heteroscedasticity.',
            codeSnippet: "model = smf.ols('temp_anomaly ~ co2_concentration', data=df_merged).fit()",
          },
          {
            n: '05',
            label: 'Result Compilation & Export',
            tool: 'markdown',
            description: 'Export OLS summary, Pearson/Spearman coefficients, and plots to results.md and /plots directory. Assert results.md exists before pipeline advances.',
          },
        ],
      } satisfies MethodsResultData,
    },
    analysis: {
      stageId, track, file: 'results.md',
      title: 'Analysis Results: CO₂ & Temperature Anomaly Correlation Study',
      content: 'Pearson r = 0.847 (p < 0.001) · Spearman ρ = 0.831. OLS R² = 0.718, confirming CO₂ as a statistically significant predictor of temperature anomaly (β = 0.0043°C/ppm, p < 0.001). Minor heteroscedasticity observed at the upper tail — noted in results.md.',
      tags: ['R² 0.718', 'p < 0.001', '2 self-heals', '9 plots'],
      stats: { 'R²': '0.718', 'p-value': '< 0.001', 'Pearson r': '0.847' },
      durationLabel: fast ? '1 min 42 sec' : '7 min 04 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'analysis',
        plots: [
          'co2_temp_timeseries.png',
          'correlation_heatmap.png',
          'residuals_plot.png',
          'distribution_co2.png',
          'distribution_temp.png',
          'qq_plot.png',
          'autocorrelation.png',
          'rolling_corr.png',
          'scatter.png',
        ],
        totalPlots: 9,
        selfHeals: 2,
        narrativeFindings: 'A statistically significant positive correlation was identified between atmospheric CO₂ concentration and surface temperature anomalies across the 2019–2024 observation window (Pearson r = 0.847, p < 0.001; Spearman ρ = 0.831, p < 0.001). The OLS regression model confirmed CO₂ concentration as a statistically significant predictor of surface temperature anomaly (β = 0.0043°C/ppm, R² = 0.718, p < 0.001). Residual analysis indicated minor heteroscedasticity at the tail of the distribution — noted as a scope constraint in the hypothesis framing.',
        statsGrid: {
          pearsonR: '0.847',
          spearmanRho: '0.831',
          r2: '0.718',
          pValue: '< 0.001',
        },
        generatedFiles: [
          { name: 'analysis.py', size: '4.2 KB', type: 'py' },
          { name: 'results.md', size: '1.8 KB', type: 'md' },
          { name: '/plots/ directory', size: '9 files · 14.3 MB', type: 'dir' },
        ],
      } satisfies AnalysisResultData,
    },
    paper: {
      stageId, track, file: 'manuscript.tex',
      title: 'Temporal Correlation Between Atmospheric CO₂ Concentration and Surface Temperature Anomalies (2019–2024)',
      content: 'Full LaTeX manuscript generated with abstract, introduction, methods, results, and discussion. 14 citations inserted. Figures embedded.',
      tags: ['LaTeX', '14 citations', '3 figures'],
      durationLabel: fast ? '4 min 11 sec' : '9 min 38 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'paper',
        texFile: { name: 'manuscript.tex', size: '14.2 KB' },
        pdfFile: { name: 'paper.pdf', size: '1.4 MB', pages: 8 },
        citations: 14,
        journal: fast ? 'Standard' : 'NeurIPS',
        abstract: 'This study investigates the temporal correlation between atmospheric CO₂ concentration and surface temperature anomalies over a five-year observation period (2019–2024) across 23 monitoring stations…',
      } satisfies PaperResultData,
    },
    literature: {
      stageId, track, file: 'literature_review.md',
      title: 'Literature Review Complete',
      content: '23 related papers identified via Semantic Scholar. 4 directly overlapping studies noted. No prior work uses the same 23-station dataset over this exact window.',
      tags: ['23 papers', '4 overlaps'],
      durationLabel: fast ? '1 min 44 sec' : '3 min 29 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'literature',
        totalScanned: 23,
        overlapCounts: { high: 4, gaps: 2, conflicts: 1 },
        highOverlapStudies: [
          { pct: '94%', title: 'Global CO₂ and Temperature Trends: A Statistical Reanalysis (2021)', venue: 'Nature Climate' },
          { pct: '87%', title: 'Time-Series Approaches to Climate Correlation Studies', venue: 'ICML 2022' },
          { pct: '81%', title: 'OLS Regression in Atmospheric Data: Limitations and Extensions', venue: 'arXiv' },
          { pct: '76%', title: 'Heteroscedasticity in Climate Time-Series: A Methodological Review', venue: 'AGU 2023' },
        ],
        suggestions: [
          { text: 'Add citation [1] to Introduction — supports your baseline claim.', action: 'Insert →' },
          { text: 'Address heteroscedasticity overlap with AGU 2023 in Limitations.', action: 'Add note →' },
        ],
      } satisfies LiteratureResultData,
    },
    referee: {
      stageId, track, file: 'referee_report.md',
      title: 'Referee Report Simulated',
      content: 'Reviewer A (minor revision): spatial autocorrelation section needs elaboration. Reviewer B (accept with minor revisions): methodology is sound, discussion is thorough.',
      tags: ['Minor revision', '2 reviewers'],
      durationLabel: fast ? '2 min 03 sec' : '4 min 17 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'referee',
        verdict: { recommendation: 'Acceptance likely after addressing statistical robustness.', chip: 'Major Revision' },
        comments: [
          { id: '#RC1', label: 'Major · Statistical Robustness', text: 'The OLS model assumes homoscedasticity. Apply HC3-consistent standard errors or provide a Breusch-Pagan test result.', action: 'Address in manuscript →' },
          { id: '#RC2', label: 'Major · Sample Period Justification', text: 'The 2019–2024 window should be explicitly justified and the post-COVID emissions recovery trend acknowledged.', action: 'Add justification →' },
        ],
      } satisfies RefereeResultData,
    },
    keywords: {
      stageId, track, file: 'keywords.md',
      title: 'Keywords Extracted',
      content: 'Primary: CO₂ concentration, temperature anomaly, climate correlation. Methodology: OLS regression, Pearson correlation, time-series analysis. Domain: atmospheric science, climate modelling.',
      tags: ['6 primary', '3 methodology', '2 domain'],
      durationLabel: fast ? '18 sec' : '41 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'keywords',
        groups: [
          { heading: 'Primary Keywords', terms: ['Atmospheric CO₂', 'Surface Temperature Anomaly', 'Climate Correlation', 'Time-Series Regression', 'OLS Regression', 'Pearson Correlation'] },
          { heading: 'Methodology Terms', terms: ['statsmodels', 'pandas', 'Spearman Correlation', 'Heteroscedasticity', 'HC3 Standard Errors'] },
          { heading: 'Domain & Index Terms', terms: ['Climate Science', 'Environmental Statistics', 'Carbon Emissions', 'Reproducible Research'] },
        ],
      } satisfies KeywordsResultData,
    },
  };
  return results[stageId];
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function startStage(stageId: StageId, track: Track) {
  _cancelAll(stageId);

  const store = usePipelineStore.getState();
  const { setStageStatus, setStageResult, addMessage, updateMessage, setBackendProjectId } = store;

  setStageStatus(stageId, 'running');
  const msgId = addMessage({ role: 'denario', type: 'status', content: 'Starting…', stageId });
  statusMsgIds.set(stageId, msgId);

  try {
    // ── 1. Ensure a backend project exists ──────────────────────────────────
    let backendId = usePipelineStore.getState().backendProjectId;

    if (!backendId) {
      const pipeline = usePipelineStore.getState().pipeline;
      const project = await api.createProject(
        pipeline?.name ?? 'denario-project',
        pipeline?.inputText ?? '',
      );
      backendId = project.id;
      setBackendProjectId(backendId);
    }

    // ── 2. Input stage: wire description, complete immediately (no SSE) ────
    if (stageId === 'input') {
      const inputText = usePipelineStore.getState().pipeline?.inputText ?? '';
      await api.setInput(backendId, inputText);
      _onStageComplete(stageId, track, 1, msgId);
      return;
    }

    // ── 3. Start the stage on the backend ───────────────────────────────────
    const backendTrack = track === 'fast' ? 'fast' : 'cmbagent';
    const apiKeys = useConfigStore.getState().getApiKeyPayload();
    await api.runStage(backendId, stageId, { track: backendTrack, ...apiKeys });

    // ── 4. Open SSE stream — pipe log lines into the status message ─────────
    const cleanup = api.streamStage(
      backendId,
      stageId,
      (event) => {
        if (event.type === 'log') {
          updateMessage(msgId, { content: event.text });
        } else if (event.type === 'complete') {
          _onStageComplete(stageId, track, event.result?.duration_sec ?? null, msgId, event.result?.content);
        } else if (event.type === 'error') {
          _onStageError(stageId, msgId, event.error);
        }
      },
      () => {
        sseCleanups.delete(stageId);
      },
    );
    sseCleanups.set(stageId, cleanup);

  } catch (err) {
    // Backend unreachable — fall back to mock so the UI stays usable
    console.warn('[stageRunner] Backend unavailable, using mock:', err);
    _runMock(stageId, track, msgId);
  }
}

export async function stopStage(stageId: StageId) {
  _cancelAll(stageId);

  const { updateMessage, setStageStatus } = usePipelineStore.getState();
  const msgId = statusMsgIds.get(stageId);
  if (msgId) {
    updateMessage(msgId, { type: 'system', content: 'Generation stopped.' });
    statusMsgIds.delete(stageId);
  }
  setStageStatus(stageId, 'idle');

  // Best-effort stop on backend (fire and forget)
  const backendId = usePipelineStore.getState().backendProjectId;
  if (backendId) {
    api.stopStage(backendId, stageId).catch(() => {});
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _onStageComplete(
  stageId:     StageId,
  track:       Track,
  durationSec: number | null,
  msgId:       string,
  rawContent?: string | null,
) {
  const { setStageResult, setStageStatus, updateMessage } = usePipelineStore.getState();

  const mock   = buildMockResult(stageId, track);
  const result = parseBackendResult(stageId, track, rawContent ?? null, durationSec, mock);
  const { durationLabel } = result;

  setStageResult(stageId, result);
  updateMessage(msgId, {
    type:    'result-card',
    content: `Generated in ${durationLabel}. Review the output below — edit before approving, or approve to proceed.`,
  });
  setStageStatus(stageId, 'complete');
  statusMsgIds.delete(stageId);
  sseCleanups.delete(stageId);
}

function _onStageError(stageId: StageId, msgId: string, error: string) {
  const { updateMessage, setStageError } = usePipelineStore.getState();
  setStageError(stageId, error);
  updateMessage(msgId, {
    type: 'result-card',
    content: 'Stage failed — see the error card below.',
    stageId,
  });
  statusMsgIds.delete(stageId);
  sseCleanups.delete(stageId);
}

function _runMock(stageId: StageId, track: Track, msgId: string) {
  const duration = track === 'fast' ? 4_000 : 8_000;
  const timer = setTimeout(() => {
    _onStageComplete(stageId, track, duration / 1000, msgId);
    activeTimers.delete(stageId);
  }, duration);
  activeTimers.set(stageId, timer);
}

function _cancelAll(stageId: StageId) {
  const timer = activeTimers.get(stageId);
  if (timer) { clearTimeout(timer); activeTimers.delete(stageId); }
  const sse = sseCleanups.get(stageId);
  if (sse) { sse(); sseCleanups.delete(stageId); }
}
