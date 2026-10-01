import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContactForm } from './ContactForm';

const meta = {
  title: 'Shop/ContactForm',
  component: ContactForm,
  parameters: {
    docs: {
      description: {
        component:
          'Contact form on /kontakt/. Saves the message to Supabase (contact_messages, insert only); the admin reads it in Poruke. Spam: hidden trap field, minimum fill time, limit per email in the database. In Storybook it only pretends to send.',
      },
    },
  },
  args: { endpoint: '#', apiKey: '', fallbackPhone: '+381 63 29 22 19', demo: true },
  decorators: [(Story) => <div style={{ maxWidth: 720 }}><Story /></div>],
} satisfies Meta<typeof ContactForm>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
export const Installation: StoryObj<typeof meta> = { args: { defaultTopic: 'ugradnja' } };
