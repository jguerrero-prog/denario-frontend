import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { PatternLibrary } from './PatternLibrary';

const meta = {
  component: PatternLibrary,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof PatternLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Header
    await expect(canvas.getByText('Pattern Library')).toBeVisible();
    await expect(canvas.getByText(/Sidebar & Panel · Atoms · Academic Theme/)).toBeVisible();

    // Group headers
    await expect(canvas.getByText(/01 — Indicators & Badges/)).toBeVisible();
    await expect(canvas.getByText(/02 — Rows & Containers/)).toBeVisible();
    await expect(canvas.getByText(/03 — Interactive Controls/)).toBeVisible();

    // Specimen names — Group 01
    for (const name of [
      'Stage Status Dot', 'Active Stage Pill', 'Mode Toggle Pill',
      'Progress Bar', 'Modified Badge', 'File Chip', 'Stat Chip', 'Toggle Switch',
    ]) {
      await expect(canvas.getByText(name)).toBeVisible();
    }

    // Specimen names — Group 02
    for (const name of [
      'Stage Row (3 states)', 'Accordion Row Header', 'Accordion Expanded Block',
      'Config Field Row', 'Section Label', 'Divider',
    ]) {
      await expect(canvas.getByText(name)).toBeVisible();
    }

    // Specimen names — Group 03
    for (const name of ['Primary Button', 'Ghost Button', 'Icon Button', 'Panel Footer Button']) {
      await expect(canvas.getByText(name)).toBeVisible();
    }

    // Key specimen content checks — some labels repeat across specimens
    await expect(canvas.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText('Pipeline')).toBeVisible();    // A3 toggle
    await expect(canvas.getByText('Modified')).toBeVisible();    // A5 badge
    await expect(canvas.getAllByText('method.md').length).toBeGreaterThanOrEqual(1);

    const primaryBtn = canvas.getByText('Approve & Proceed →');
    await expect(primaryBtn).toBeVisible();
    await expect(canvas.getByText('Edit hypothesis')).toBeVisible();
    await expect(canvas.getByText('Export manuscript preview')).toBeVisible();
  },
};
