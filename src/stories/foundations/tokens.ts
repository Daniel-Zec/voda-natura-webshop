/** Token lists for the Foundations pages. Values are read live from the CSS variables, so the docs never drift from the code. */
export const semanticColors: { group: string; tokens: { name: string; use: string }[] }[] = [
  { group: 'Backgrounds', tokens: [
    { name: 'bg-page', use: 'Main page background' },
    { name: 'bg-subtle', use: 'Warm light sections' },
    { name: 'bg-warm', use: 'Warm tan cards and highlight sections' },
    { name: 'bg-muted', use: 'Muted areas, image wells, admin background' },
    { name: 'bg-brand-soft', use: 'Soft water-blue background' },
    { name: 'bg-eco-soft', use: 'Soft green background (savings, eco)' },
    { name: 'bg-inverse', use: 'Dark sections, footer' },
  ]},
  { group: 'Text', tokens: [
    { name: 'text-primary', use: 'Headings and body text' },
    { name: 'text-secondary', use: 'Supporting text' },
    { name: 'text-muted', use: 'Captions, placeholders' },
    { name: 'text-disabled', use: 'Disabled labels' },
    { name: 'text-brand', use: 'Brand text, highlighted prices' },
    { name: 'text-link', use: 'Links' },
    { name: 'text-link-hover', use: 'Links on hover' },
  ]},
  { group: 'Actions (buttons)', tokens: [
    { name: 'action-primary', use: 'Main button: Dodaj u korpu, Poruči' },
    { name: 'action-primary-hover', use: 'Main button hover' },
    { name: 'action-secondary', use: 'Guidance: Pronađi pravi filter' },
    { name: 'action-secondary-hover', use: 'Secondary hover' },
    { name: 'action-ghost-hover', use: 'Hover fill for outline/text buttons' },
    { name: 'action-disabled', use: 'Disabled fill' },
  ]},
  { group: 'Borders', tokens: [
    { name: 'border-subtle', use: 'Dividers inside cards' },
    { name: 'border-default', use: 'Card and input borders' },
    { name: 'border-strong', use: 'Hovered inputs, outline buttons' },
    { name: 'border-warm', use: 'Borders on warm sections' },
    { name: 'border-focus', use: 'Keyboard focus ring' },
  ]},
  { group: 'Accents (decoration only)', tokens: [
    { name: 'accent-water', use: 'Logo blue – icons only, never text' },
    { name: 'accent-natura', use: 'Logo green – icons, check marks' },
    { name: 'accent-sand', use: 'Warm tan shapes, chip borders' },
  ]},
  { group: 'Status', tokens: [
    { name: 'status-success', use: 'In stock, order confirmed' },
    { name: 'status-success-bg', use: 'Success background' },
    { name: 'status-warning', use: 'Made to order, waiting for partner' },
    { name: 'status-warning-bg', use: 'Warning background' },
    { name: 'status-error', use: 'Errors, cancelled orders' },
    { name: 'status-error-bg', use: 'Error background' },
    { name: 'status-info', use: 'Information' },
    { name: 'status-info-bg', use: 'Info background' },
  ]},
];

export const scales = [
  { name: 'blue', label: 'Water Blue', steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] },
  { name: 'green', label: 'Natura Green', steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] },
  { name: 'gray', label: 'Neutral Gray', steps: [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] },
  { name: 'sand', label: 'Sand Tan', steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'red', label: 'Red', steps: [50, 100, 500, 600, 700] },
  { name: 'amber', label: 'Amber', steps: [50, 100, 500, 600, 700] },
];

export const textStyles = [
  { name: 'hero', label: 'Hero', use: 'Homepage headline', sample: 'Čista voda iz vaše slavine' },
  { name: 'h1', label: 'H1', use: 'Page title, product name', sample: 'RO 6 WFU – reverzna osmoza' },
  { name: 'h2', label: 'H2', use: 'Section title', sample: 'Najtraženiji sistemi' },
  { name: 'h3', label: 'H3', use: 'Card title, subtitle', sample: 'Ugradnja u Subotici' },
  { name: 'h4', label: 'H4', use: 'Small heading, form group', sample: 'Podaci za dostavu' },
  { name: 'body-lg', label: 'Body Large', use: 'Intro text, product lead', sample: 'Voda za piće i kuvanje za celu porodicu.' },
  { name: 'body', label: 'Body', use: 'Shop default text, inputs', sample: 'Plaćate gotovinom kuriru kada paket stigne.' },
  { name: 'body-sm', label: 'Body Small', use: 'Admin default, tables, labels', sample: 'Šifra: BL10 · Na stanju' },
  { name: 'caption', label: 'Caption', use: 'Hints, meta (minimum size)', sample: 'Održavanje: 2.438 RSD godišnje' },
  { name: 'overline', label: 'Overline', use: 'UPPERCASE labels only', sample: 'Flaširana voda vs. filter' },
  { name: 'price', label: 'Price', use: 'Price on product page', sample: '56.899 RSD' },
];

export const spacing = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
export const radii = ['sm', 'md', 'lg', 'xl', '2xl', 'pill'];
