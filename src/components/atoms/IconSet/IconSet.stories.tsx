import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { IconSet } from './IconSet';

const meta = {
  component: IconSet,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof IconSet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Header
    await expect(canvas.getByText('Icon Set · Sidebar & Panel')).toBeVisible();
    await expect(canvas.getByText(/STEM aesthetic/)).toBeVisible();

    // Icon labels — stage icons
    for (const name of ['idea', 'methods', 'analysis', 'literature-review', 'referee-report']) {
      await expect(canvas.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    }

    // Icon sublabels
    await expect(canvas.getByText('Stage 2: Hypothesis')).toBeVisible();
    await expect(canvas.getByText('Stage 3: Protocol')).toBeVisible();
    await expect(canvas.getByText('Stage 7: Peer review')).toBeVisible();

    // Navigation / utility icon labels
    await expect(canvas.getAllByText('nav-chevron-right').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('nav-chevron-down').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('settings-gear').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('external-link').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('lock').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('lock-open').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('download').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('copy').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('check-circle').length).toBeGreaterThanOrEqual(1);
    await expect(canvas.getAllByText('close-x').length).toBeGreaterThanOrEqual(1);

    // State Reference Guide
    await expect(canvas.getByText('STATE REFERENCE GUIDE')).toBeVisible();

    // Reference table headers
    await expect(canvas.getByText('ICON NAME')).toBeVisible();
    await expect(canvas.getByText('LOCATION')).toBeVisible();
    await expect(canvas.getByText('STATE BEHAVIOR')).toBeVisible();

    // Reference table rows — spot check locations
    await expect(canvas.getByText('Sidebar: Stage 1')).toBeVisible();
    await expect(canvas.getByText('Sidebar: Stage 2')).toBeVisible();
    await expect(canvas.getByText('Sidebar: Stage 8')).toBeVisible();
    await expect(canvas.getByText('Code viewer: top bar')).toBeVisible();
    await expect(canvas.getByText('Dialogs: modal close')).toBeVisible();

    // Footer note
    await expect(canvas.getByText(/Icon design principle/)).toBeVisible();
  },
};
