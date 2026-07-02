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
    defaultMode: {
      control: 'radio',
      options: ['pipeline', 'modular'],
      description: 'Pipeline locks stages sequentially; Modular makes every stage accessible.',
    },
    activeStageId: {
      control: 'select',
      options: ['input', 'idea', 'methods', 'analysis', 'paper', 'literature', 'referee', 'keywords'],
      description: 'The stage that is currently open / active.',
    },
    stagesComplete: {
      control: { type: 'range', min: 0, max: 8, step: 1 },
      description: 'Number of stages completed — drives the progress bar.',
    },
    userEmail: {
      control: 'text',
      description: 'Authenticated user email shown in the user row.',
    },
    projectName: {
      control: 'text',
      description: 'Currently open project name. Leave blank to show "No project open".',
    },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Home state — no pipeline run has started yet. Input Prompt is the entry point. */
export const Home: Story = {
  args: {
    defaultMode: 'pipeline',
    activeStageId: 'input',
    stagesComplete: 0,
    userEmail: 'researcher@lab.edu',
  },
};

/** Pipeline in progress — 3 stages done, Analysis is active. */
export const PipelineInProgress: Story = {
  args: {
    defaultMode: 'pipeline',
    activeStageId: 'analysis',
    stagesComplete: 3,
    userEmail: 'researcher@lab.edu',
    projectName: 'co2-temp-study',
  },
};

/** Modular mode — every stage is accessible regardless of completion. */
export const ModularMode: Story = {
  args: {
    defaultMode: 'modular',
    activeStageId: 'literature',
    stagesComplete: 5,
    userEmail: 'researcher@lab.edu',
    projectName: 'protein-folding-ml',
  },
};

/** All stages complete. */
export const AllComplete: Story = {
  args: {
    defaultMode: 'pipeline',
    activeStageId: 'keywords',
    stagesComplete: 8,
    userEmail: 'j.guerrero@simonsfoundation.org',
    projectName: 'equity-returns-analysis',
  },
};
