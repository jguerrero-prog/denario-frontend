import type { Preview } from '@storybook/react-vite';
import '../src/tokens/tokens.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app',     value: '#F5F0E8' },
        { name: 'sidebar', value: '#EDE7D9' },
        { name: 'white',   value: '#FFFFFF' },
      ],
    },
  },
};

export default preview;