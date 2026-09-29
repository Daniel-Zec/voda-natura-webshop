import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChoosePath } from './ChoosePath';
import { cartridgeChips } from '../../../data/home';

const meta = {
  title: 'Shop/ChoosePath',
  component: ChoosePath,
  parameters: { docs: { description: { component: 'The two ways to shop from the Personas: guided (quiz, blue) and product-aware (search by name or code, sand). Both lead to the same cart and checkout.' } } },
  args: {
    quiz: { href: '#', questions: ['Stan ili kuća?', 'Gradski vodovod ili bunar?', 'Šta vam smeta: ukus hlora, kamenac, gvožđe?'] },
    search: { action: '#', chips: cartridgeChips, allHref: '#' },
  },
} satisfies Meta<typeof ChoosePath>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
