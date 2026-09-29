import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'VodaNatura — design system',
    brandImage: './images/brand/vodanatura-logo.svg',
    brandTarget: '_self',
    colorPrimary: '#1F752B',
    colorSecondary: '#0071A4',
    fontBase: "'Open Sans', system-ui, sans-serif",
    appBg: '#FBF8F3',
    appBorderColor: '#EBE1D0',
    textColor: '#2A292B',
    barSelectedColor: '#0071A4',
  }),
});
