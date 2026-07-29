import { usePipelineStore } from '../store/pipelineStore';
import { useConfigStore, type ModelOverrideStage } from '../store/configStore';
import { api } from '../api/client';
import { parseBackendResult, parseIdeaLog, parseMethodsPlanningLog, parseMethodsStepLog } from './parsers';
import type {
  StageId,
  StageResult,
  Track,
  IdeaResultData,
  IdeaTranscriptRound,
  MethodsResultData,
  MethodsPlanningTurn,
  MethodsExecutionStep,
  AnalysisResultData,
  PaperResultData,
  LiteratureResultData,
  SearchedPaper,
  RefereeResultData,
  KeywordsResultData,
} from '../types/pipeline';

// Idea's adversarial transcript lives in a separate file from idea.md
// (idea_generation_output/idea.log), served by the generic project file
// route — so it's fetched and parsed as a best-effort side channel rather
// than through parseBackendResult's single rawContent/structured shape.
// Missing/unreachable is expected for mock runs and older projects; fail
// quietly rather than surface an error for a non-essential enrichment.
export async function fetchIdeaTranscript(backendId: string): Promise<IdeaTranscriptRound[]> {
  try {
    const res = await fetch(api.fileUrl(backendId, 'idea_generation_output/idea.log'));
    if (!res.ok) return [];
    return parseIdeaLog(await res.text());
  } catch {
    return [];
  }
}

// The full, deduplicated set of papers the search actually found (see
// DenarioBackend's denario/papers_log_parser.py) — only 3-ish of these ever
// reach literature.json's `papers` (the LLM's own curated comparison).
// Same best-effort side-channel pattern as fetchIdeaTranscript: missing is
// expected for mock runs and older projects generated before this sidecar
// existed, so fail quietly to an empty list rather than surface an error.
export async function fetchSearchedPapers(backendId: string): Promise<SearchedPaper[]> {
  try {
    const res = await fetch(api.fileUrl(backendId, 'literature_output/papers_processed.json'));
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Methods' Rigorous-track reasoning log (see REASONING_LOG_TICKETS.md) —
// unlike idea.log, this is Rigorous-only: Standard/fast Methods generation
// (langgraph_agents/methods.py) writes no log at all, confirmed against real
// runs, so a 404 on final_plan.json here is the expected, normal case for a
// Standard-track project, not an error. Real directory is singular
// `method_generation_output`, not `methods_generation_output`.
const METHODS_LOG_EMPTY = { planningLog: [] as MethodsPlanningTurn[], executionLog: [] as MethodsExecutionStep[] };

export async function fetchMethodsLog(
  backendId: string,
): Promise<{ planningLog: MethodsPlanningTurn[]; executionLog: MethodsExecutionStep[] }> {
  try {
    const planRes = await fetch(api.fileUrl(backendId, 'method_generation_output/planning/final_plan.json'));
    if (!planRes.ok) return METHODS_LOG_EMPTY;
    const finalPlan = await planRes.json();
    const subTasks: { sub_task: string }[] = Array.isArray(finalPlan?.sub_tasks) ? finalPlan.sub_tasks : [];
    if (subTasks.length === 0) return METHODS_LOG_EMPTY;

    const planningRes = await fetch(api.fileUrl(backendId, 'method_generation_output/planning/chats/chat_output_planning.json'));
    const planningLog = planningRes.ok
      ? parseMethodsPlanningLog(await planningRes.json(), ['planner', 'plan_reviewer'])
      : [];

    const stepResults = await Promise.all(
      subTasks.map(async (task, i) => {
        const stepNum = i + 1;
        const stepRes = await fetch(
          api.fileUrl(backendId, `method_generation_output/control/chats/chat_output_researcher_step_${stepNum}.json`)
        );
        if (!stepRes.ok) return null;
        return parseMethodsStepLog(await stepRes.json(), stepNum, task.sub_task, 'researcher');
      })
    );
    const executionLog = stepResults.filter((s): s is MethodsExecutionStep => s !== null);

    return { planningLog, executionLog };
  } catch {
    return METHODS_LOG_EMPTY;
  }
}

// Stages with a real per-agent model choice — see configStore's
// ModelOverrideStage / ROADMAP.md ticket 1.6.
const MODEL_OVERRIDE_STAGES: ModelOverrideStage[] = ['idea', 'methods', 'analysis', 'paper'];

// ── Module-level run state ────────────────────────────────────────────────────

const activeTimers  = new Map<StageId, ReturnType<typeof setTimeout>>();
const statusMsgIds  = new Map<StageId, string>();
// Cleanup functions returned by api.streamStage (close the EventSource)
const sseCleanups   = new Map<StageId, () => void>();

// ── Mock results ──────────────────────────────────────────────────────────────

export function buildMockResult(stageId: StageId, track: Track): StageResult {
  const standard = track === 'standard';
  const results: Record<StageId, StageResult> = {
    input: {
      stageId, track, file: 'workspace',
      title: 'Research Scope Configured',
      content: 'Dataset and research question validated. Tools and preferred libraries recorded.',
      durationLabel: standard ? '11 sec' : '24 sec',
      generatedAt: Date.now(),
    },
    idea: {
      stageId, track, file: 'idea.md',
      title: 'Temporal Correlation Between Atmospheric CO₂ Concentration and Surface Temperature Anomalies: A 5-Year Constrained Observational Study (2019–2024)',
      content: 'This study tests whether a statistically significant positive correlation exists between rising atmospheric CO₂ concentrations and concurrent surface temperature anomalies using Pearson and Spearman correlation coefficients alongside OLS regression (statsmodels).',
      tags: ['Time-series regression', 'OLS · Pearson · Spearman'],
      durationLabel: standard ? '1 min 08 sec' : '2 min 41 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'idea',
        hypothesis: 'This study investigates whether rising atmospheric CO₂ concentrations (ppm) serve as a statistically significant predictor of concurrent surface temperature anomalies (°C) across a constrained 5-year observation window (2019–2024). The null hypothesis posits no significant relationship between CO₂ concentration and temperature anomaly. The alternative hypothesis posits that CO₂ concentration is a statistically significant predictor of surface temperature anomaly at p < 0.05 significance.',
        scopeNote: {
          title: 'Constraint flagged by adversarial review',
          body: 'The 5-year observation window (2019–2024) is acknowledged as a scope limitation. Findings should be framed as period-specific correlations rather than multi-decadal climate trends. This constraint was identified by the idea_hater agent during the adversarial loop and incorporated into the hypothesis framing before finalisation.',
          suggestions: [
            {
              id: 'reframe-period-specific',
              label: 'Reframe hypothesis as period-specific rather than multi-decadal',
              actionable: true,
              followUpMessage: 'I can tighten the hypothesis language so it explicitly claims a period-specific correlation (2019–2024) rather than implying a multi-decadal climate trend. This is a wording change to idea.md — no new data needed.',
              actionLabel: 'Reframe hypothesis →',
            },
            {
              id: 'sensitivity-subwindows',
              label: 'Add a sensitivity check across sub-windows within 2019–2024',
              actionable: true,
              followUpMessage: 'I can re-run the correlation test on rolling sub-windows (e.g. 2019–2021 vs 2022–2024) using the data you already have, to show the relationship holds across the period rather than being driven by one segment.',
              actionLabel: 'Run sensitivity check →',
            },
            {
              id: 'need-multidecadal-data',
              label: 'Would need multi-decadal station data to test long-term trends',
              actionable: false,
            },
          ],
        },
        researchFraming: 'The study targets the climate science domain, focusing on empirical validation within the Python scientific stack (pandas, statsmodels) to maintain full reproducibility. The 2019–2024 observation window captures a post-pandemic emissions recovery period of particular scientific interest, and the period-specific framing aligns with the dataset boundaries available.',
        methodologyTags: ['Time-series correlation analysis', 'OLS · Pearson · Spearman · Scope-constrained'],
        transcript: [
          { round: 1, speaker: 'idea_maker', content: 'Proposed a CO₂-temperature correlation study across the 2019–2024 window.' },
          { round: 1, speaker: 'idea_hater', content: 'Flagged the narrow 5-year observation window as a limitation for climate-scale claims.' },
          { round: 2, speaker: 'idea_maker', content: 'Refined the hypothesis with explicit scope-constrained, period-specific framing.' },
          { round: 2, speaker: 'idea_hater', content: 'Accepted the refined framing, with a note of caution against multi-decadal interpretation.' },
          ...(standard ? [] : [
            { round: 3, speaker: 'idea_maker' as const, content: 'Strengthened the statistical methodology rationale behind the Pearson/Spearman/OLS approach.' },
          ]),
        ],
        stageOutput: 'idea.md saved · Stage 3 (Methods) unlocked',
        meta: { track: standard ? 'Standard' : 'Rigorous', iterations: standard ? 3 : 4, duration: standard ? '1m 08s' : '6m 42s' },
      } satisfies IdeaResultData,
    },
    methods: {
      stageId, track, file: 'method.md',
      title: 'Technical Methodology: CO₂-Temperature Correlation Analysis',
      content: 'Five-step pipeline: ingest and validate CSVs, resample and align series, generate time-series plots, run Pearson/Spearman/OLS correlation tests, then export results and coefficients to results.md.',
      tags: ['pandas · statsmodels', '5 steps · est. 2 min runtime'],
      durationLabel: standard ? '58 sec' : '2 min 12 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'methods',
        overview: 'This methodology outlines the complete analytical framework for investigating the temporal correlation between atmospheric CO₂ concentration (ppm) and surface temperature anomalies (°C) across a five-year observation window (2019–2024). The pipeline applies a time-series regression approach using pandas and statsmodels.',
        sections: [
          {
            number: '1',
            title: 'Data Preparation',
            substeps: [
              {
                number: '1.1',
                label: 'Data Ingestion & Validation',
                body: 'Load `co2_readings.csv` and `temp_anomalies.csv` using `pandas.read_csv()`, assert column dtypes, and validate date index continuity across 2019–2024.',
                points: [],
                code: "df_co2 = pd.read_csv('co2_readings.csv', parse_dates=['date'], index_col='date')",
              },
              {
                number: '1.2',
                label: 'Preprocessing & Alignment',
                body: null,
                points: [
                  { text: "Resample both series to monthly frequency using `.resample('MS').mean()`." },
                  { text: 'Apply linear interpolation for gaps under 3 consecutive months.' },
                  { text: 'Normalise units — CO₂ as ppm deviation from a 415ppm baseline.' },
                ],
              },
            ],
          },
          {
            number: '2',
            title: 'Statistical Analysis',
            substeps: [
              {
                number: '2.1',
                label: 'Exploratory Time-Series Analysis',
                body: 'Generate a dual-axis time-series plot and compute a rolling 12-month Pearson correlation window, exported as `co2_temp_timeseries.png` at 300dpi.',
                points: [],
              },
              {
                number: '2.2',
                label: 'Statistical Correlation Testing',
                body: null,
                points: [
                  { text: 'Run `scipy.stats.pearsonr` and `spearmanr`.' },
                  { text: 'Fit an OLS regression using `statsmodels`.' },
                  { text: 'Evaluate p-values, R², and residual plots for heteroscedasticity.' },
                ],
                code: "model = smf.ols('temp_anomaly ~ co2_concentration', data=df_merged).fit()",
              },
              {
                number: '2.3',
                label: 'Result Compilation & Export',
                body: 'Export the OLS summary, Pearson/Spearman coefficients, and plots to `results.md` and the `/plots` directory.',
                points: [],
              },
            ],
          },
        ],
        // Rigorous-track-only reasoning log (see REASONING_LOG_TICKETS.md) —
        // empty for Standard/fast, since the real backend has confirmed zero
        // log output for that track.
        planningLog: standard ? [] : [
          { speaker: 'planner', content: 'Proposed a 2-step plan: data preparation/alignment, then correlation analysis and export.' },
          { speaker: 'plan_reviewer', content: 'Recommended adding an explicit stationarity check before running OLS on the time series.' },
        ],
        executionLog: standard ? [] : [
          { step: 1, title: 'Data preparation and alignment', content: 'Loaded and resampled both series to monthly frequency, normalising CO₂ as a deviation from a 415ppm baseline.' },
          { step: 2, title: 'Correlation analysis and export', content: 'Ran Pearson/Spearman correlation and OLS regression, exporting the summary statistics and plots.' },
        ],
      } satisfies MethodsResultData,
    },
    analysis: {
      stageId, track, file: 'results.md',
      title: 'Analysis Results: CO₂ & Temperature Anomaly Correlation Study',
      content: 'Pearson r = 0.847 (p < 0.001) · Spearman ρ = 0.831. OLS R² = 0.718, confirming CO₂ as a statistically significant predictor of temperature anomaly (β = 0.0043°C/ppm, p < 0.001). Minor heteroscedasticity observed at the upper tail — noted in results.md.',
      tags: ['R² 0.718', 'p < 0.001', '2 self-heals', '9 plots'],
      stats: { 'R²': '0.718', 'p-value': '< 0.001', 'Pearson r': '0.847' },
      durationLabel: standard ? '1 min 42 sec' : '7 min 04 sec',
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
        plotCaptions: {
          'co2_temp_timeseries.png': 'Monthly CO₂ concentration and surface temperature anomaly, 2019–2024.',
          'correlation_heatmap.png': 'Pearson correlation heatmap across all variable pairs.',
          'residuals_plot.png':      'OLS residuals vs. fitted values.',
          'distribution_co2.png':    'Distribution of CO₂ concentration (ppm) across 2019–2024.',
          'distribution_temp.png':   'Distribution of surface temperature anomaly (°C) across 2019–2024.',
          'qq_plot.png':             'Q-Q plot of regression residuals against normal distribution.',
          'autocorrelation.png':     'Autocorrelation function (ACF) of CO₂ time series.',
          'rolling_corr.png':        'Rolling 12-month Pearson correlation between CO₂ and temperature.',
          'scatter.png':             'Scatter plot of CO₂ concentration vs. temperature anomaly with OLS fit.',
        },
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
      durationLabel: standard ? '4 min 11 sec' : '9 min 38 sec',
      generatedAt: Date.now(),
      stageData: {
        kind: 'paper',
        citations: 14,
        abstract: 'This study investigates the temporal correlation between atmospheric CO₂ concentration and surface temperature anomalies over a five-year observation period (2019–2024) across 23 monitoring stations…',
      } satisfies PaperResultData,
    },
    literature: {
      stageId, track, file: 'literature.md',
      title: 'Literature Review Complete',
      content: 'Related work identified via Semantic Scholar.',
      tags: [],
      durationLabel: standard ? '1 min 44 sec' : '3 min 29 sec',
      generatedAt: Date.now(),
      stageData: { kind: 'literature', searchedPapers: [] } satisfies LiteratureResultData,
    },
    referee: {
      stageId, track, file: 'referee.md',
      title: 'Referee Report Simulated',
      content: 'Two simulated peer reviewers assess the manuscript.',
      tags: [],
      durationLabel: standard ? '2 min 03 sec' : '4 min 17 sec',
      generatedAt: Date.now(),
      stageData: { kind: 'referee' } satisfies RefereeResultData,
    },
    keywords: {
      stageId, track, file: 'keywords.md',
      title: 'Keywords Extracted',
      content: 'Keywords extracted from the manuscript.',
      tags: [],
      durationLabel: standard ? '18 sec' : '41 sec',
      generatedAt: Date.now(),
      stageData: { kind: 'keywords' } satisfies KeywordsResultData,
    },
  };
  return results[stageId];
}

// Which (stage, track) combinations get the collapsible log-card message
// instead of a plain cycling status line. Idea: both tracks (idea_maker/
// idea_hater runs either way). Methods: Rigorous only — Standard/fast
// Methods generation writes no reasoning log at all, confirmed against real
// runs, so showing an anticipatory card there would just sit empty forever.
function hasLogCard(stageId: StageId, track: Track): boolean {
  if (stageId === 'idea') return true;
  if (stageId === 'methods') return track === 'rigorous';
  return false;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function startStage(stageId: StageId, track: Track, opts: { forceRestart?: boolean } = {}) {
  _cancelAll(stageId);

  const store = usePipelineStore.getState();
  const { setStageStatus, setStageResult, addMessage, updateMessage, setBackendProjectId } = store;

  setStageStatus(stageId, 'running');
  // Its content stays empty; the card renders live status + the log itself,
  // not message.content.
  const msgId = hasLogCard(stageId, track)
    ? addMessage({ role: 'denario', type: 'log-card', content: '', stageId })
    : addMessage({ role: 'denario', type: 'status', content: 'Starting…', stageId });
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
    const backendTrack = track === 'standard' ? 'fast' : 'cmbagent';
    const apiKeys = useConfigStore.getState().getApiKeyPayload();
    const modelOverrides = MODEL_OVERRIDE_STAGES.includes(stageId as ModelOverrideStage)
      ? useConfigStore.getState().getModelOverridesPayload(stageId as ModelOverrideStage)
      : {};
    const stageParams = usePipelineStore.getState().pipeline?.stages[stageId]?.params;
    const journal = stageParams?.journal as string | undefined;
    const addCitations = stageParams?.add_citations as boolean | undefined;
    const numKeywords = stageParams?.num_keywords as number | undefined;
    const kwType = stageParams?.kw_type as string | undefined;
    await api.runStage(backendId, stageId, {
      track: backendTrack, model_overrides: modelOverrides, force_restart: opts.forceRestart,
      journal, add_citations: addCitations,
      n_keywords: numKeywords, kw_type: kwType,
      ...apiKeys,
    });

    // ── 4. Open SSE stream — pipe log lines into the status message ─────────
    const cleanup = api.streamStage(
      backendId,
      stageId,
      (event) => {
        if (event.type === 'log') {
          // A log-card message doesn't display message.content (raw stdout,
          // not the structured log) — skip the write.
          if (!hasLogCard(stageId, track)) updateMessage(msgId, { content: event.text });
        } else if (event.type === 'complete') {
          _onStageComplete(stageId, track, event.result?.duration_sec ?? null, msgId, event.result?.content, event.result?.structured);
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

function stageCompleteMessage(stageId: StageId, durationLabel: string): string {
  switch (stageId) {
    case 'input':
      return 'Your research description has been saved. Ready to generate your hypothesis.';
    case 'idea':
      return `Hypothesis generated in ${durationLabel}. Review and edit if needed, then approve to continue.`;
    case 'methods':
      return `Methods plan generated in ${durationLabel}. Review each step and edit if needed, then approve to continue.`;
    case 'analysis':
      return `Analysis complete in ${durationLabel}. Review the findings below, then approve to continue.`;
    case 'paper':
      return `Paper draft generated in ${durationLabel}. Review and download the LaTeX file, then approve to continue.`;
    case 'literature':
      return `Literature review complete in ${durationLabel}. Review the findings below.`;
    case 'referee':
      return `Referee report generated in ${durationLabel}. Review the comments below.`;
    case 'keywords':
      return `Keywords extracted in ${durationLabel}. Review the groups below.`;
  }
}

function _onStageComplete(
  stageId:     StageId,
  track:       Track,
  durationSec: number | null,
  msgId:       string,
  rawContent?: string | null,
  structured?: Record<string, unknown> | null,
) {
  const { setStageResult, setStageStatus, updateMessage, removeMessage, addMessage } = usePipelineStore.getState();

  const mock   = buildMockResult(stageId, track);
  const result = parseBackendResult(stageId, track, rawContent ?? null, durationSec, mock, structured);
  const { durationLabel } = result;

  setStageResult(stageId, result);
  setStageStatus(stageId, 'complete');
  statusMsgIds.delete(stageId);
  sseCleanups.delete(stageId);

  if (stageId === 'idea') {
    const backendId = usePipelineStore.getState().backendProjectId;
    if (backendId) {
      fetchIdeaTranscript(backendId).then(transcript => {
        if (transcript.length > 0) usePipelineStore.getState().setIdeaTranscript(transcript);
      });
    }
  }

  if (stageId === 'methods') {
    const backendId = usePipelineStore.getState().backendProjectId;
    if (backendId) {
      fetchMethodsLog(backendId).then(({ planningLog, executionLog }) => {
        if (planningLog.length > 0 || executionLog.length > 0) {
          usePipelineStore.getState().setMethodsLog(planningLog, executionLog);
        }
      });
    }
  }

  if (stageId === 'literature') {
    const backendId = usePipelineStore.getState().backendProjectId;
    if (backendId) {
      fetchSearchedPapers(backendId).then(papers => {
        if (papers.length > 0) usePipelineStore.getState().setLiteratureSearchedPapers(papers);
      });
    }
  }

  // Track was already chosen on the homepage — skip the manual hand-off
  // (Generate Hypothesis button + track prompt) and go straight into
  // hypothesis generation, with no intermediate confirmation message.
  const initialTrack = usePipelineStore.getState().pipeline?.initialTrack;
  if (stageId === 'input' && initialTrack) {
    removeMessage(msgId);
    const { unlockNextStage, setStageTrack } = usePipelineStore.getState();
    unlockNextStage('input');
    setStageTrack('idea', initialTrack);
    startStage('idea', initialTrack);
    return;
  }

  if (hasLogCard(stageId, track)) {
    // Leave the log-card message as-is (it collapses on its own via its
    // collapseTrigger) — the result card is a new message appended right
    // after it, not a replacement.
    addMessage({
      role: 'denario',
      type: 'result-card',
      content: stageCompleteMessage(stageId, durationLabel),
      stageId,
    });
    return;
  }

  updateMessage(msgId, {
    type:    'result-card',
    content: stageCompleteMessage(stageId, durationLabel),
  });
}

function _onStageError(stageId: StageId, msgId: string, error: string) {
  const { updateMessage, addMessage, setStageError } = usePipelineStore.getState();
  setStageError(stageId, error);

  // track isn't a param here (unlike _onStageComplete) — read it back from
  // the stage, set by setStageTrack before startStage ever runs.
  const track = usePipelineStore.getState().pipeline?.stages[stageId]?.track;
  if (track && hasLogCard(stageId, track)) {
    // Same reasoning as _onStageComplete — keep the log-card message intact
    // (whatever partial log exists is still worth seeing) and append
    // the error as its own card rather than overwriting it.
    addMessage({
      role: 'denario',
      type: 'result-card',
      content: 'Stage failed — see the error card below.',
      stageId,
    });
  } else {
    updateMessage(msgId, {
      type: 'result-card',
      content: 'Stage failed — see the error card below.',
      stageId,
    });
  }
  statusMsgIds.delete(stageId);
  sseCleanups.delete(stageId);
}

function _runMock(stageId: StageId, track: Track, msgId: string) {
  const duration = track === 'standard' ? 4_000 : 8_000;
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
