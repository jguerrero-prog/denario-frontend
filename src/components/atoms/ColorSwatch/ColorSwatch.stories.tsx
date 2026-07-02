import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ColorSwatch } from './ColorSwatch';
import { colors } from '../../../tokens';

const meta = {
  component: ColorSwatch,
  tags: ['ai-generated'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BrandGreen: Story = {
  args: { name: 'brand', hex: colors.brand.base },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('brand')).toBeVisible();
    await expect(canvas.getByText(colors.brand.base)).toBeVisible();
  },
};

export const AppBackground: Story = {
  args: { name: 'bg-app', hex: colors.bg.app },
};

export const TextPrimary: Story = {
  args: { name: 'text-pri', hex: colors.text.pri },
};

export const CssCheck: Story = {
  args: { name: 'brand', hex: colors.brand.base },
  play: async ({ canvasElement }) => {
    const chip = canvasElement.querySelector<HTMLElement>('[style*="background-color"]');
    await expect(chip).toBeTruthy();
    // Proves tokens.css loaded: brand green resolves to rgb(45, 106, 45)
    await expect(chip!.style.backgroundColor).toBe('rgb(45, 106, 45)');
  },
};

/** All background & surface tokens */
export const AllBackgrounds: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '24px', background: colors.bg.app }}>
      {Object.entries(colors.bg).map(([name, hex]) => (
        <ColorSwatch key={name} name={`bg-${name}`} hex={hex} />
      ))}
    </div>
  ),
};

/** All text tokens */
export const AllText: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '24px', background: colors.bg.app }}>
      {Object.entries(colors.text).map(([name, hex]) => (
        <ColorSwatch key={name} name={`text-${name}`} hex={hex} />
      ))}
    </div>
  ),
};

/** All brand tokens */
export const AllBrand: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '24px', background: colors.bg.app }}>
      {Object.entries(colors.brand).map(([name, hex]) => (
        <ColorSwatch key={name} name={`brand-${name}`} hex={hex} />
      ))}
    </div>
  ),
};
