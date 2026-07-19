import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ComponentLibraryPt2 } from './ComponentLibraryPt2';

const meta = {
  component: ComponentLibraryPt2,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof ComponentLibraryPt2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Page header
    await expect(canvas.getByText('Component Library · Part 2 of 2')).toBeVisible();
    await expect(canvas.getByText(/Conversation Column · Artifact Cards/)).toBeVisible();

    // Section labels
    for (const label of [
      '01 — IDEA CARD', '02 — METHODS CARD', '03 — ANALYSIS RESULTS CARD',
      '04 — PAPER CARD', '05 — LITERATURE REVIEW CARD',
      '06 — REFEREE REPORT CARD', '07 — KEYWORDS CARD',
    ]) {
      await expect(canvas.getByText(label)).toBeVisible();
    }

    // 01 Idea card
    await expect(canvas.getByText('idea.md')).toBeVisible();
    // title appears in both idea and paper cards
    await expect(canvas.getAllByText(/Temporal Correlation Between Atmospheric CO₂/).length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('Time-series regression')).toBeVisible();

    // 02 Methods card
    await expect(canvas.getByText('method.md')).toBeVisible();
    await expect(canvas.getByText('Technical Methodology: Time-Series Correlation Analysis')).toBeVisible();
    await expect(canvas.getByText('Data Ingestion & Validation')).toBeVisible();
    await expect(canvas.getByText('Statistical Testing')).toBeVisible();

    // 03 Analysis results card
    await expect(canvas.getByText('results.md')).toBeVisible();
    await expect(canvas.getByText('Visual Outputs')).toBeVisible();
    await expect(canvas.getByText('co2_temp_timeseries.png')).toBeVisible();
    await expect(canvas.getByText('+6 more')).toBeVisible();

    // 04 Paper card
    await expect(canvas.getByText('manuscript.tex + paper.pdf')).toBeVisible();
    await expect(canvas.getByText('manuscript.tex')).toBeVisible();
    await expect(canvas.getByText('paper.pdf')).toBeVisible();
    await expect(canvas.getByText('Abstract')).toBeVisible();
    await expect(canvas.getAllByText('Open PDF →').length).toBeGreaterThanOrEqual(1);

    // 05 Literature review card
    await expect(canvas.getByText('literature.md')).toBeVisible();
    await expect(canvas.getByText('4 high-overlap papers')).toBeVisible();
    await expect(canvas.getByText('High-Overlap Studies')).toBeVisible();
    await expect(canvas.getByText('Nature Climate')).toBeVisible();

    // 06 Referee report card
    await expect(canvas.getByText('referee.md')).toBeVisible();
    await expect(canvas.getAllByText('Major Revision').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('Reviewer Comments')).toBeVisible();
    await expect(canvas.getByText('#RC1')).toBeVisible();

    // 07 Keywords card
    await expect(canvas.getByText('keywords.md')).toBeVisible();
    await expect(canvas.getByText('Primary Keywords')).toBeVisible();
    await expect(canvas.getByText('Atmospheric CO2')).toBeVisible();
    await expect(canvas.getByText('Heteroscedasticity')).toBeVisible();
    await expect(canvas.getByText('Finalise →')).toBeVisible();
  },
};
