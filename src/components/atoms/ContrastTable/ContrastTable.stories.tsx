import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ContrastTable } from './ContrastTable';

const meta = {
  component: ContrastTable,
  tags: ['ai-generated'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof ContrastTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // All 4 token names appear (each twice: table + guidelines)
    for (const token of ['text-primary', 'text-secondary', 'text-muted', 'text-decorative']) {
      const els = canvas.getAllByText(token);
      await expect(els.length).toBeGreaterThanOrEqual(1);
      await expect(els[0]).toBeVisible();
    }
    // Pass/fail indicators present
    await expect(canvas.getAllByText(/✓/).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/✗/).length).toBeGreaterThan(0);
  },
};
