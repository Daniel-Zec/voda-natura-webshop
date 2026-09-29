import type { Meta, StoryObj } from '@storybook/react-vite';
import { SavingsCalculator } from './SavingsCalculator';

const meta = {
  title: 'Shop/SavingsCalculator',
  component: SavingsCalculator,
  parameters: {
    docs: {
      description: {
        component:
          'The bottled-water story: household size × price per litre → bottles, kilograms carried and yearly cost. Assumptions (2 l per person per day, 1.5 l bottles, 45 RSD/l) are props and still need confirming (VODANATURA-50). On the site it loads as a React island when scrolled into view.',
      },
    },
  },
  args: { cta: { href: '#', label: 'Pogledaj filtere za vodu za piće' } },
  globals: { backgrounds: { value: 'ecoSoft' } },
  decorators: [(Story) => <div style={{ maxWidth: 560 }}><Story /></div>],
} satisfies Meta<typeof SavingsCalculator>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  args: {
    children: (
      <>
        Za poređenje: sistem reverzne osmoze RO 6 WFU košta <strong>56.899 RSD jednom</strong>, a membrana se menja na 3 godine.
      </>
    ),
  },
};
