import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Elevation } from './Elevation';

const meta = {
  component: Elevation,
  tags: ['ai-generated'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof Elevation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    for (const label of ['Flat · Border only', 'Raised · Subtle shadow', 'Floating · Manuscript']) {
      await expect(canvas.getByText(label)).toBeVisible();
    }
    const flat     = canvas.getByRole('img', { name: 'flat' }) as HTMLElement;
    const raised   = canvas.getByRole('img', { name: 'raised' }) as HTMLElement;
    const floating = canvas.getByRole('img', { name: 'floating' }) as HTMLElement;
    // Flat uses border, not shadow
    await expect(getComputedStyle(flat).boxShadow).toBe('none');
    // Raised and floating have shadows
    await expect(getComputedStyle(raised).boxShadow).not.toBe('none');
    await expect(getComputedStyle(floating).boxShadow).not.toBe('none');
  },
};
