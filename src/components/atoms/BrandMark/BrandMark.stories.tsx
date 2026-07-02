import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { BrandMark } from './BrandMark';

const meta = {
  component: BrandMark,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // Page header
    await expect(canvas.getByText('Denario · Brand Mark')).toBeVisible();
    await expect(canvas.getByText(/Step 1 · Primary Mark/)).toBeVisible();

    // Section labels
    await expect(canvas.getByText(/PRIMARY MARK/)).toBeVisible();
    await expect(canvas.getByText(/CONVERGENCE VARIANT/)).toBeVisible();
    await expect(canvas.getByText('WORDMARK LOCKUPS')).toBeVisible();
    await expect(canvas.getByText(/SCALE VARIANTS/)).toBeVisible();

    // Primary mark annotations
    await expect(canvas.getByText('640px')).toBeVisible();
    await expect(canvas.getByText(/Equal weight/)).toBeVisible();

    // Wordmark lockups
    // "Denario" appears multiple times (A, B, C lockups + convergence section)
    await expect(canvas.getAllByText('Denario').length).toBeGreaterThanOrEqual(3);
    await expect(canvas.getByText('Lockup A · Primary lockup on dark background.')).toBeVisible();
    await expect(canvas.getByText(/Lockup B · Compact UI/)).toBeVisible();
    await expect(canvas.getByText(/Lockup C · Optimized for academic cream/)).toBeVisible();
    await expect(canvas.getByText(/Lockup D · Monogram/)).toBeVisible();
    await expect(canvas.getAllByText('Scientific Research AI').length).toBeGreaterThanOrEqual(1);

    // Scale variants
    for (const label of ['Large', 'Medium', 'Small', 'Mini', 'Icon']) {
      await expect(canvas.getByText(label)).toBeVisible();
    }
    await expect(canvas.getByText('640×160px')).toBeVisible();
    await expect(canvas.getByText('80×20px')).toBeVisible();

    // Colour palette
    await expect(canvas.getByText('Bio/Environment')).toBeVisible();
    await expect(canvas.getByText('Chem/Physics')).toBeVisible();
    await expect(canvas.getByText('CompSci/Math')).toBeVisible();
    await expect(canvas.getByText('Med/Interdisciplinary')).toBeVisible();
    await expect(canvas.getByText('UI Primary')).toBeVisible();
    await expect(canvas.getByText('#16A34A')).toBeVisible();
    await expect(canvas.getByText('#2D6A2D')).toBeVisible();

    // Footer
    await expect(canvas.getByText(/Denario Brand Mark · v1\.0/)).toBeVisible();
  },
};
