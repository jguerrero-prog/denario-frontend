import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { BorderRadius } from './BorderRadius';

const meta = {
  component: BorderRadius,
  tags: ['ai-generated'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof BorderRadius>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // All 5 token names visible
    for (const name of ['radius-sm', 'radius-md', 'radius-lg', 'radius-xl', 'radius-pill']) {
      await expect(canvas.getByText(name)).toBeVisible();
    }
    // Pill shape is wider than tall
    const pill = canvas.getByRole('img', { name: /radius-pill/ });
    await expect(pill).toBeVisible();
    await expect((pill as HTMLElement).style.borderRadius).toBe('999px');
  },
};
