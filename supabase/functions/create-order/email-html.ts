// HTML version of the order emails (2 Oct 2026). The templates stay plain text in the admin panel
// (Emailovi); this file wraps them in a simple branded layout so they are easy to read:
//   * "Label: value" lines get a bold label
//   * {items} becomes a product table, {address} a framed block, the "Ukupno…" line is highlighted,
//     {made_to_order_note} a highlighted box
// Only inline styles and tables, because email apps (Gmail, Outlook) ignore <style> and modern CSS.
// No images: many apps block them, so the logo is a coloured wordmark.
// Pure TypeScript (no Deno APIs) so it can be previewed locally with Node.

export interface HtmlItem {
  sku: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  made_to_order: boolean;
}

const C = {
  blue: '#00AEEF',
  green: '#39B54A',
  greenDark: '#1F752B',
  text: '#414042',
  muted: '#6B6B70',
  border: '#E6E1D8',
  bg: '#F6F4EF',
  card: '#FFFFFF',
  warnBg: '#FFF6E5',
  warnText: '#8A5A00',
};
const FONT = "'Open Sans', Arial, Helvetica, sans-serif";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rsd = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}&nbsp;RSD`;

function itemsTable(items: HtmlItem[]): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${C.border};vertical-align:top;">
          <div style="font-weight:600;color:${C.text};">${esc(i.name)}</div>
          <div style="font-size:13px;color:${C.muted};">Šifra: ${esc(i.sku)} · ${rsd(i.unit_price)} / kom${
            i.made_to_order ? ` · <span style="color:${C.warnText};font-weight:600;">po porudžbini, 3–4 meseca</span>` : ''
          }</div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid ${C.border};vertical-align:top;text-align:center;white-space:nowrap;color:${C.text};">${i.qty} ×</td>
        <td style="padding:12px 0;border-bottom:1px solid ${C.border};vertical-align:top;text-align:right;white-space:nowrap;font-weight:600;color:${C.text};">${rsd(i.line_total)}</td>
      </tr>`,
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:${FONT};font-size:15px;line-height:22px;margin:4px 0 8px;">
      <tr>
        <th align="left" style="padding:0 0 8px;border-bottom:2px solid ${C.border};font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};font-weight:600;">Proizvod</th>
        <th style="padding:0 8px 8px;border-bottom:2px solid ${C.border};font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};font-weight:600;">Kol.</th>
        <th align="right" style="padding:0 0 8px;border-bottom:2px solid ${C.border};font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};font-weight:600;">Iznos</th>
      </tr>${rows}
    </table>`;
}

const box = (inner: string, bg: string, color: string, border = 'transparent') =>
  `<div style="margin:4px 0;padding:14px 16px;border-radius:8px;background:${bg};border:1px solid ${border};color:${color};">${inner}</div>`;

/** One plain-text paragraph → HTML. "Label: value" lines get a bold label; other lines stay as they are. */
function paragraph(text: string): string {
  const lines = text.split('\n').map((line) => {
    const m = line.match(/^([A-Za-zČĆŠĐŽčćšđž ()/,.-]{2,40}):\s(.*)$/);
    if (!m) return esc(line);
    // The order total stands out: bigger and green.
    if (/^Ukupno/.test(m[1]))
      return `<strong style="color:${C.text};">${esc(m[1])}:</strong> <span style="font-size:20px;font-weight:700;color:${C.greenDark};white-space:nowrap;">${esc(m[2])}</span>`;
    return `<strong style="color:${C.text};">${esc(m[1])}:</strong> ${esc(m[2])}`;
  });
  return `<p style="margin:0 0 14px;">${lines.join('<br>')}</p>`;
}

/**
 * Builds the HTML email from a filled-in plain-text template.
 * `text` must still contain the markers {items}, {address} and {made_to_order_note} where they belong
 * (the caller fills every other variable first).
 */
export function renderEmailHtml(opts: {
  text: string;
  items: HtmlItem[];
  address: string;
  madeToOrderNote: string;
  /** Hidden preview line that inbox lists show next to the subject */
  preheader: string;
}): string {
  const blocks = opts.text
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (p === '{items}') return itemsTable(opts.items);
      if (p === '{made_to_order_note}') return opts.madeToOrderNote ? box(esc(opts.madeToOrderNote), C.warnBg, C.warnText) : '';
      if (p.includes('{address}')) {
        const label = p.replace('{address}', '').trim();
        const addr = esc(opts.address).replace(/\n/g, '<br>');
        return `${label ? `<p style="margin:0 0 6px;font-weight:600;">${esc(label)}</p>` : ''}${box(addr, C.bg, C.text, C.border)}<div style="height:10px;"></div>`;
      }
      if (p.includes('{items}')) {
        const [before, after] = p.split('{items}');
        return `${before.trim() ? paragraph(before.trim()) : ''}${itemsTable(opts.items)}${after.trim() ? paragraph(after.trim()) : ''}`;
      }
      return paragraph(p.replace('{made_to_order_note}', opts.madeToOrderNote));
    })
    .join('\n');

  return `<!doctype html>
<html lang="sr-Latn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VodaNatura</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
  <span style="display:none;max-height:0;overflow:hidden;">${esc(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border-radius:12px;border:1px solid ${C.border};">
        <tr><td style="padding:22px 28px 18px;border-bottom:3px solid ${C.green};">
          <div style="font-family:${FONT};font-size:24px;font-weight:700;letter-spacing:.02em;line-height:28px;">
            <span style="color:${C.blue};">VODA</span><span style="color:${C.green};font-weight:400;">NATURA</span>
          </div>
          <div style="font-family:${FONT};font-size:12px;color:${C.muted};letter-spacing:.08em;text-transform:uppercase;margin-top:2px;">Filteri vode za vaš dom</div>
        </td></tr>
        <tr><td style="padding:24px 28px 12px;font-family:${FONT};font-size:15px;line-height:23px;color:${C.text};">
${blocks}
        </td></tr>
        <tr><td style="padding:16px 28px 22px;border-top:1px solid ${C.border};font-family:${FONT};font-size:12px;line-height:18px;color:${C.muted};">
          VodaNatura (Decorambient d.o.o.) · Filipa Kljajića 22, 24000 Subotica<br>
          <a href="https://vodanatura.com" style="color:${C.muted};">vodanatura.com</a> · Plaćanje pouzećem, kada paket stigne.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
