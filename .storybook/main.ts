import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: ['../public'],
  docs: { defaultName: 'Docs' },
  core: { disableTelemetry: true },
  // Published next to the shop on GitHub Pages under /storybook/
  viteFinal: async (cfg) => {
    cfg.base = process.env.STORYBOOK_BASE ?? cfg.base;
    return cfg;
  },
};
export default config;
