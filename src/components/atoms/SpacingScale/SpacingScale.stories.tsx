import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { SpacingScale } from './SpacingScale';

const meta = {
  component: SpacingScale,
  tags: ['ai-generated'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof SpacingScale>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // All 11 steps render
    for (const label of ['4px', '8px', '12px', '16px', '20px', '24px', '32px', '40px', '48px', '64px', '80px']) {
      await expect(canvas.getByText(label)).toBeVisible();
    }
    // Bars are sized correctly — smallest is 4px tall, largest is 80px tall
    const bars = canvas.getAllByRole('img', { hidden: false });
    await expect(bars.length).toBe(11);
    const first = bars[0] as HTMLElement;
    const last  = bars[bars.length - 1] as HTMLElement;
    await expect(first.style.height).toBe('4px');
    await expect(last.style.height).toBe('80px');
  },
};
