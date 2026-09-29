import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepList } from './StepList';

const meta = {
  title: 'Shop/StepList',
  component: StepList,
  parameters: { docs: { description: { component: 'Numbered steps: four cards from 900 px, one stacked list on phones. Text follows the 29 Sep decisions (no tracking promise, shipping paid to the courier).' } } },
  args: {
    steps: [
      { title: 'Izaberite', text: 'Sami ili uz kviz. Uporedite do 3 proizvoda jedan pored drugog.' },
      { title: 'Poručite bez registracije', text: 'Ime, telefon i adresa – to je sve. Potvrda stiže odmah na e-mail.' },
      { title: 'Stiže BEX kurirom', text: 'Za oko 4 radna dana. Dostavu plaćate kuriru, a cena zavisi od težine paketa.' },
      { title: 'Platite pri preuzimanju', text: 'Gotovinom kuriru, tek kada paket stigne na vašu adresu.' },
    ],
  },
} satisfies Meta<typeof StepList>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
