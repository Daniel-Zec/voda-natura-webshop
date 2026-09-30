/** Date ranges for the dashboard and the commission summary. `to` is exclusive. */
export type PeriodKey = 'week' | 'month' | 'lastMonth' | '30' | 'custom';
export interface Period {
  from: Date;
  to: Date;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const periodLabels: Record<PeriodKey, string> = {
  week: 'Ova nedelja',
  month: 'Ovaj mesec',
  lastMonth: 'Prošli mesec',
  '30': 'Poslednjih 30 dana',
  custom: 'Izabrani period',
};

export function periodFor(key: PeriodKey, custom?: { from: string; to: string }): Period {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  switch (key) {
    case 'week': {
      const dow = (today.getDay() + 6) % 7; // Monday = 0
      return { from: addDays(today, -dow), to: tomorrow };
    }
    case 'month':
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: tomorrow };
    case 'lastMonth':
      return { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 1) };
    case '30':
      return { from: addDays(today, -29), to: tomorrow };
    case 'custom': {
      const f = custom?.from ? new Date(`${custom.from}T00:00:00`) : addDays(today, -29);
      const t = custom?.to ? addDays(new Date(`${custom.to}T00:00:00`), 1) : tomorrow;
      return { from: f, to: t > f ? t : addDays(f, 1) };
    }
  }
}

/** Same length, right before. */
export function previousPeriod(p: Period): Period {
  const len = p.to.getTime() - p.from.getTime();
  return { from: new Date(p.from.getTime() - len), to: p.from };
}

export const inPeriod = (iso: string | null | undefined, p: Period) => {
  if (!iso) return false;
  const t = Date.parse(iso);
  return t >= p.from.getTime() && t < p.to.getTime();
};

export function daysOf(p: Period): Date[] {
  const out: Date[] = [];
  for (let d = new Date(p.from); d < p.to; d = addDays(d, 1)) out.push(d);
  return out;
}

export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function deltaPct(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;
  return ((now - before) / before) * 100;
}
