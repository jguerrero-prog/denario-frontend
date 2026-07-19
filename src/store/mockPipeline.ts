import type { Pipeline } from '../types/pipeline';
import { STAGE_CONFIG, STAGE_ORDER } from '../config/stageConfig';

// Build default models for all stages from STAGE_CONFIG
function defaultModels(stageId: keyof typeof STAGE_CONFIG) {
  return Object.fromEntries(
    STAGE_CONFIG[stageId].modelRoles.map(r => [r.key, r.default])
  );
}

function defaultParams(stageId: keyof typeof STAGE_CONFIG) {
  return Object.fromEntries(
    STAGE_CONFIG[stageId].paramFields.map(f => [f.key, f.default])
  );
}

export const MOCK_PIPELINE: Pipeline = {
  id: 'demo',
  name: 'co2-temp-study',
  workspace: '~/research/co2-temp-study/',
  inputFiles: [{ name: 'co2_data_2019_2024.csv', size: '4.2 MB' }],
  inputText:
    'I have a CSV file with daily atmospheric CO₂ readings (ppm) and surface temperature anomalies (°C) collected across 23 monitoring stations from 2019–2024. I want to investigate whether rising CO₂ concentrations serve as a statistically significant predictor of temperature anomalies over this 5-year observation window.',
  preferredTools: 'pandas, statsmodels, matplotlib, scipy',
  mode: 'pipeline',
  activeStageId: 'idea',

  stages: Object.fromEntries(
    STAGE_ORDER.map((id, idx) => [
      id,
      {
        id,
        status: idx === 0 ? 'complete' : idx === 1 ? 'idle' : 'locked',
        track: idx === 0 ? 'standard' : undefined,
        models: defaultModels(id),
        params: defaultParams(id),
        result:
          idx === 0
            ? {
                stageId: 'input',
                track: 'standard',
                file: 'idea.md',
                title:
                  'Temporal Correlation Between Atmospheric CO₂ Concentration and Surface Temperature Anomalies (2019–2024)',
                content:
                  'This study tests whether a statistically significant positive correlation exists between rising atmospheric CO₂ concentrations and concurrent surface temperature anomalies using Pearson and Spearman correlation coefficients alongside OLS regression (statsmodels).',
                tags: ['Time-series regression', 'OLS · Pearson · Spearman'],
                durationLabel: '1 min 12 sec',
                generatedAt: Date.now() - 60_000,
              }
            : undefined,
      },
    ])
  ) as Pipeline['stages'],

  messages: [
    {
      id: 'm1',
      role: 'user',
      type: 'text',
      content:
        'I have a CSV file with daily atmospheric CO₂ readings (ppm) and surface temperature anomalies (°C) collected across 23 monitoring stations from 2019–2024. I want to investigate whether rising CO₂ concentrations serve as a statistically significant predictor of temperature anomalies over this 5-year observation window.',
      stageId: 'input',
      timestamp: Date.now() - 180_000,
    },
    {
      id: 'm2',
      role: 'denario',
      type: 'stage-prompt',
      content: STAGE_CONFIG.input.denarioOpener,
      stageId: 'input',
      timestamp: Date.now() - 175_000,
    },
    {
      id: 'm3',
      role: 'user',
      type: 'text',
      content: 'Standard',
      stageId: 'input',
      timestamp: Date.now() - 170_000,
    },
    {
      id: 'm4',
      role: 'denario',
      type: 'result-card',
      content: 'Generated in 1 min 12 sec. Review the hypothesis below — edit it here before approving, or approve to unlock the Methods stage.',
      stageId: 'input',
      track: 'standard',
      timestamp: Date.now() - 72_000,
    },
    {
      id: 'm5',
      role: 'user',
      type: 'text',
      content: 'Do you think this hypothesis is sound enough for peer review?',
      timestamp: Date.now() - 60_000,
    },
    {
      id: 'm6',
      role: 'denario',
      type: 'text',
      content:
        'Mostly yes — the temporal scope is well-defined and the statistical approach is appropriate. One thing to watch: the 23 stations are likely spatially correlated, so you may need to account for spatial autocorrelation (e.g. Moran\'s I) before claiming the OLS residuals are independent. The idea_hater flagged this in iteration 3. Worth noting in your methods.',
      timestamp: Date.now() - 55_000,
    },
    {
      id: 'm7',
      role: 'denario',
      type: 'system',
      content: 'Stage 1 · Input complete — Stage 2 · Idea unlocked.',
      timestamp: Date.now() - 50_000,
    },
    {
      id: 'm8',
      role: 'denario',
      type: 'stage-prompt',
      content: STAGE_CONFIG.idea.denarioOpener,
      stageId: 'idea',
      timestamp: Date.now() - 48_000,
    },
  ],

  createdAt: Date.now() - 200_000,
  updatedAt: Date.now() - 55_000,
};
