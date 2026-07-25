import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Organisms/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#F5F0E8' },
        { name: 'dark', value: '#111110' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Story />
        {/* Simulate the rest of the app surface so the sidebar reads in context */}
        <div style={{ flex: 1, background: '#F5F0E8' }} />
      </div>
    ),
  ],
  argTypes: {
    projectName: {
      control: 'text',
      description: 'Currently open project name. Leave blank to show "No project open".',
    },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ───────────────────────────────────────────────────────────────────
// The app-shell nav (New/Lab/Paper) is static — no per-stage state to vary
// here anymore. Stage-by-stage navigation moved out of the sidebar; see
// ROADMAP.md's Epic 6 (Compose Bar).

/** No project open — the default state before starting or loading one. */
export const NoProject: Story = {
  args: {},
};

/** A project is currently open. */
export const WithProject: Story = {
  args: {
    projectName: 'co2-temp-study',
  },
};
