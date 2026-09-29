import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
  parameters: { docs: { description: { component: 'Section title block (H2) with optional overline, subtitle and "see all" link. **center** is used for explanatory sections; on phones it aligns left like the mock-up.' } } },
  args: {
    title: 'Najtraženiji sistemi',
    subtitle: 'Sve cene su sa PDV-om. Uz svaki sistem vidite i koliko košta godišnje održavanje.',
    link: { href: '#', label: 'Svi sistemi' },
  },
} satisfies Meta<typeof SectionHeader>;
export default meta;
export const WithLink: StoryObj<typeof meta> = {};
export const Centered: StoryObj<typeof meta> = { args: { title: 'Kako poručivanje funkcioniše', subtitle: 'Bez registracije i bez plaćanja karticom unapred.', link: undefined, align: 'center' } };
export const WithOverline: StoryObj<typeof meta> = { args: { overline: 'Već imate filter?', overlineTone: 'sand', title: 'Vreme je za nove uloške', link: undefined } };
