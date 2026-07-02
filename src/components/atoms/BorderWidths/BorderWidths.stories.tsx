import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { BorderWidths } from './BorderWidths';

const meta = {
  component: BorderWidths,
  tags: ['ai-generated'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'app' },
  },
} satisfies Meta<typeof BorderWidths>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    for (const token of ['border-hairline', 'border-default', 'border-card', 'border-accent', 'border-strong']) {
      await expect(canvas.getByText(token)).toBeVisible();
    }
    // Accent line is 2px and brand green
    const accent = canvas.getByRole('img', { name: /border-accent/ }) as HTMLElement;
    await expect(accent.style.borderTopWidth).toBe('2px');
    await expect(accent.style.borderTopColor).toBe('var(--color-border-accent)');
    // Hairline is 0.5px
    const hairline = canvas.getByRole('img', { name: /border-hairline/ }) as HTMLElement;
    await expect(hairline.style.borderTopWidth).toBe('0.5px');
  },
};
