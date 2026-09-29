import type { Preview } from '@storybook/react-vite';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    backgrounds: {
      options: {
        page: { name: 'Page (white)', value: '#FFFFFF' },
        subtle: { name: 'bg/subtle (sand 50)', value: '#FBF8F3' },
        warm: { name: 'bg/warm (sand 100)', value: '#F5EFE5' },
        brandSoft: { name: 'bg/brand-soft (blue 50)', value: '#EAF8FE' },
        ecoSoft: { name: 'bg/eco-soft (green 50)', value: '#EFF9F1' },
        inverse: { name: 'bg/inverse (gray 900)', value: '#2A292B' },
      },
    },
    viewport: {
      options: {
        phone: { name: 'Telefon 390', styles: { width: '390px', height: '844px' } },
        tablet: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
      },
    },
    a11y: { test: 'error' },
    options: {
      storySort: { order: ['Introduction', 'Foundations', ['Colours', 'Typography', 'Spacing and shape', 'Icons'], 'UI', 'Shop', 'Layout'] },
    },
  },
  initialGlobals: { backgrounds: { value: 'page' } },
  tags: ['autodocs'],
};
export default preview;
