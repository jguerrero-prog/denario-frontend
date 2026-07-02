import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { LayoutGrid } from './LayoutGrid';

const meta = {
  component: LayoutGrid,
  tags: ['ai-generated'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof LayoutGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Title and subtitle
    await expect(canvas.getByText('Layout Grid')).toBeVisible();
    await expect(canvas.getByText('Desktop · 1440px canvas · 3-zone layout')).toBeVisible();

    // Diagram is accessible
    await expect(
      canvas.getByRole('img', { name: /3-zone layout diagram/i })
    ).toBeVisible();

    // Zone labels inside the diagram
    await expect(canvas.getByText('Left Sidebar')).toBeVisible();
    await expect(canvas.getByText('Conversation Column')).toBeVisible();
    await expect(canvas.getByText('Right Panel')).toBeVisible();

    // Table section
    await expect(canvas.getByText('Column Breakdown')).toBeVisible();
    for (const zone of ['Left', 'Center', 'Right']) {
      await expect(canvas.getByText(zone)).toBeVisible();
    }
    await expect(canvas.getByText('Fluid')).toBeVisible();

    // Key spacing section
    await expect(canvas.getByText('Key Spacing')).toBeVisible();
    await expect(
      canvas.getByText(/Conversation column content max-width: 700px/)
    ).toBeVisible();
    await expect(canvas.getByText(/Top breadcrumb bar height: 40px/)).toBeVisible();
  },
};
