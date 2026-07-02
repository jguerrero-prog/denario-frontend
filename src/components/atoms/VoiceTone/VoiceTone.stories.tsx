import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { VoiceTone } from './VoiceTone';

const meta = {
  component: VoiceTone,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof VoiceTone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Header
    await expect(canvas.getByText('Voice & Tone')).toBeVisible();
    await expect(canvas.getByText(/Denario speaks like a sharp research collaborator/)).toBeVisible();

    // Archetype
    await expect(canvas.getByText('THE ARCHETYPE')).toBeVisible();
    await expect(canvas.getByText('The Senior Postdoc')).toBeVisible();
    await expect(canvas.getByText('Direct, not blunt')).toBeVisible();
    await expect(canvas.getByText('Curious, not performative')).toBeVisible();
    await expect(canvas.getByText('Warm, not familiar')).toBeVisible();

    // Principles
    await expect(canvas.getByText('FOUR CORE PRINCIPLES')).toBeVisible();
    await expect(canvas.getByText('Say what happened, then what is next.')).toBeVisible();
    await expect(canvas.getByText('Name the problem. Offer the path.')).toBeVisible();
    await expect(canvas.getByText("Match the researcher's register.")).toBeVisible();
    await expect(canvas.getByText('Earn enthusiasm.')).toBeVisible();

    // Principle examples — avoid/use labels appear multiple times across 4 cards
    await expect(canvas.getAllByText('✗ Avoid').length).toBeGreaterThanOrEqual(4);
    await expect(canvas.getAllByText('✓ Use').length).toBeGreaterThanOrEqual(4);

    // Language table
    await expect(canvas.getByText('LANGUAGE DO NOT / DO')).toBeVisible();
    await expect(canvas.getByText('✗ Do Not')).toBeVisible();
    await expect(canvas.getByText('✓ Do')).toBeVisible();
    await expect(canvas.getByText('Done. Here is what I found.')).toBeVisible();
    await expect(canvas.getByText('Approve to unlock the Methods stage.')).toBeVisible();

    // Stage-by-stage
    await expect(canvas.getByText('STAGE-BY-STAGE COPY EXAMPLES')).toBeVisible();
    // stage nums 01-04 also appear in principle cards, so use getAllByText
    for (const [num, name] of [['01', 'Input Prompt'], ['02', 'Idea'], ['03', 'Methods'], ['04', 'Analysis'], ['05', 'Paper'], ['06', 'Literature Review'], ['07', 'Referee Report'], ['08', 'Keywords']]) {
      await expect(canvas.getAllByText(num).length).toBeGreaterThanOrEqual(1);
      await expect(canvas.getByText(name)).toBeVisible();
    }

    // Stage copy spot checks
    await expect(canvas.getByText(/What are you investigating/)).toBeVisible();
    await expect(canvas.getByText(/Methods locked. Moving to analysis/)).toBeVisible();
    await expect(canvas.getByText(/Pearson r = 0\.847/)).toBeVisible();
    await expect(canvas.getAllByText(/Pipeline complete/).length).toBeGreaterThanOrEqual(1);
  },
};
