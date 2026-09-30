import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { AdminIcon, type AdminIconName } from '../components/AdminIcon';
import { BarChart } from '../components/BarChart';
import { PeriodPicker } from '../components/PeriodPicker';
import { Btn, Card, Kpi, Loading, Notice, PageHeader, useLoad } from '../components/ui';
import { daysSince, num, rsd, settingNumber } from '../lib/labels';
import { daysOf, deltaPct, inPeriod, isoDay, periodFor, previousPeriod, type PeriodKey } from '../lib/period';
import { href } from '../router';
import s from './screens.module.css';

const CANCELLED = ['cancelled', 'refused', 'returned'];
const FINAL = ['completed', 'refused', 'returned', 'cancelled'];

export function Dashboard() {
  const { api, catalog, openProduct } = useAdmin();
  const [key, setKey] = useState<PeriodKey>('30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [topN, setTopN] = useState<5 | 10>(5);

  const { data, error } = useLoad(async () => {
    const [orders, lines, emails, imports, changes] = await Promise.all([
      api.listOrders(),
      api.listCommissionLines(),
      api.listEmailLog(),
      api.listStockImports(),
      api.lastStatusChanges(),
    ]);
    return { orders, lines, emails, imports, changes };
  }, [api]);

  const period = periodFor(key, custom);
  const prev = previousPeriod(period);

  const stats = useMemo(() => {
    if (!data) return null;
    const calc = (p: typeof period) => {
      const orders = data.orders.filter((o) => inPeriod(o.created_at, p));
      const lines = data.lines.filter((l) => inPeriod(l.ordered_at, p));
      return {
        count: orders.length,
        value: orders.filter((o) => !CANCELLED.includes(o.status)).reduce((x, o) => x + o.items_total, 0),
        delivered: orders.filter((o) => ['delivered', 'completed'].includes(o.status)).reduce((x, o) => x + o.items_total, 0),
        pending: lines.filter((l) => l.commission_status === 'pending').reduce((x, l) => x + l.commission_amount, 0),
        earned: lines.filter((l) => l.commission_status === 'earned').reduce((x, l) => x + l.commission_amount, 0),
      };
    };
    const now = calc(period);
    const before = calc(prev);

    const bars = daysOf(period).map((d) => {
      const day = isoDay(d);
      const os = data.orders.filter((o) => isoDay(new Date(o.created_at)) === day);
      const value = os.reduce((x, o) => x + o.items_total, 0);
      const label = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
      return { label, value: os.length, tooltip: `${label}: ${os.length} porudžb. · ${rsd(value)}` };
    });

    const units = new Map<string, { productId: number | null; name: string; qty: number; value: number }>();
    for (const o of data.orders)
      if (inPeriod(o.created_at, period) && !CANCELLED.includes(o.status))
        for (const i of o.items) {
          const k = i.sku;
          const u = units.get(k) ?? { productId: i.product_id, name: i.name, qty: 0, value: 0 };
          u.qty += i.quantity;
          u.value += i.line_total;
          units.set(k, u);
        }
    const top = [...units.values()].sort((a, b) => b.qty - a.qty || b.value - a.value);
    return { now, before, bars, top };
  }, [data, period.from.getTime(), period.to.getTime()]);

  const attention = useMemo(() => {
    if (!data || !catalog) return [];
    const items: { icon: AdminIconName; tone: 'warn' | 'error' | 'info'; title: string; sub: string; to: string }[] = [];
    const settings = catalog.settings;

    const failedMail = data.orders.filter((o) => {
      if (o.status !== 'new') return false;
      const mails = data.emails.filter((e) => e.order_id === o.id && e.template === 'order_to_partner');
      return !mails.some((e) => e.status === 'sent');
    });
    if (failedMail.length)
      items.push({ icon: 'mail', tone: 'error', title: `${failedMail.length} nov${failedMail.length === 1 ? 'a porudžbina' : 'e porudžbine'} bez poslatog emaila za DA`, sub: failedMail.map((o) => o.order_number).join(', '), to: href('porudzbine') + '?status=new' });

    const stuckDays = settingNumber(settings, 'order_stuck_days', 3);
    const lastChange = new Map<number, string>();
    for (const c of data.changes) if (!lastChange.has(c.order_id)) lastChange.set(c.order_id, c.changed_at);
    const stuck = data.orders.filter((o) => !FINAL.includes(o.status) && o.status !== 'delivered' && (daysSince(lastChange.get(o.id) ?? o.created_at) ?? 0) > stuckDays);
    if (stuck.length)
      items.push({ icon: 'orders', tone: 'warn', title: `${stuck.length} porudžb. stoji u istom statusu duže od ${stuckDays} dana`, sub: stuck.slice(0, 6).map((o) => o.order_number).join(', '), to: href('porudzbine') });

    const lastImport = data.imports.find((i) => i.status !== 'undone');
    const warnDays = settingNumber(settings, 'stock_import_warn_days', 7);
    const age = daysSince(lastImport?.created_at);
    if (age === null || age > warnDays)
      items.push({ icon: 'box', tone: 'warn', title: age === null ? 'Zalihe još nisu uvezene' : `Poslednji uvoz zaliha je star ${age} dana`, sub: 'DA šalje fajl na zalihe@vodanatura.com 1–2 puta nedeljno.', to: href('proizvodi', 'zalihe') });

    const sync = settings.price_sync_status as { ok?: boolean; unmatched?: string[] } | null;
    if (!settings.price_sync_last_run)
      items.push({ icon: 'refresh', tone: 'info', title: 'Automatsko čitanje cena sa decorambient.com još ne radi', sub: 'Cene su iz uvoza kataloga 29.09. (VODANATURA-71).', to: href('proizvodi', 'cene') });
    else if (sync && (!sync.ok || (sync.unmatched?.length ?? 0) > 0))
      items.push({ icon: 'refresh', tone: 'error', title: 'Čitanje cena sa decorambient.com nije uspelo ili ima nepovezane proizvode', sub: (sync.unmatched ?? []).slice(0, 6).join(', '), to: href('proizvodi', 'cene') });

    const overrides = catalog.products.filter((p) => p.price_mode !== 'auto');
    if (overrides.length)
      items.push({ icon: 'tag', tone: 'info', title: `${overrides.length} proizvod${overrides.length === 1 ? ' ima' : 'a ima'} ručnu korekciju cene`, sub: 'Proverite da li je greška ispravljena kod DA, pa vratite na Auto.', to: href('proizvodi', 'cene') + '?filter=override' });

    if (settings.email_test_mode === true)
      items.push({ icon: 'mail', tone: 'warn', title: 'Test režim emailova je uključen', sub: 'Svi emailovi idu vama umesto DA i kupcima.', to: href('emailovi', 'podesavanja') });
    if (!settings.partner_order_email)
      items.push({ icon: 'alert', tone: 'warn', title: 'Nedostaje email adresa DA za porudžbine', sub: 'Unesite je u podešavanjima emailova.', to: href('emailovi', 'podesavanja') });
    if (settings.commission_default_pct === null || settings.commission_default_pct === undefined)
      items.push({ icon: 'percent', tone: 'warn', title: 'Podrazumevana provizija nije uneta', sub: 'Procenat još nije dogovoren sa DA (VODANATURA-23).', to: href('provizija', 'stope') });
    return items;
  }, [data, catalog]);

  if (error) return <Notice tone="error">Greška pri učitavanju: {error}</Notice>;
  if (!stats || !catalog) return <Loading />;
  const maxTop = Math.max(1, ...stats.top.map((t) => t.qty));

  return (
    <>
      <PageHeader
        title="Kontrolna tabla"
        subtitle={`Brojevi za period, u poređenju sa prethodnim periodom iste dužine.`}
        actions={<PeriodPicker value={key} onChange={setKey} custom={custom} onCustom={setCustom} options={['week', 'month', '30', 'custom']} />}
      />
      <div className={s.kpis}>
        <Kpi label="Porudžbine" value={num(stats.now.count)} delta={deltaPct(stats.now.count, stats.before.count)} />
        <Kpi label="Vrednost – poručeno" value={rsd(stats.now.value)} delta={deltaPct(stats.now.value, stats.before.value)} hint="Bez otkazanih; plaća se pouzećem" />
        <Kpi label="Vrednost – isporučeno" value={rsd(stats.now.delivered)} delta={deltaPct(stats.now.delivered, stats.before.delivered)} />
        <Kpi label="Posetioci" value="—" hint="Alat za analitiku još nije izabran (VODANATURA-63)." />
        <Kpi label="Provizija – na čekanju" value={rsd(Math.round(stats.now.pending))} delta={deltaPct(stats.now.pending, stats.before.pending)} />
        <Kpi label="Provizija – zarađena" value={rsd(Math.round(stats.now.earned))} delta={deltaPct(stats.now.earned, stats.before.earned)} hint={`${settingNumber(catalog.settings, 'commission_earn_days', 7)} dana posle isporuke`} />
      </div>

      <div className={s.cols}>
        <div className={s.stack}>
          <Card title="Porudžbine po danu">
            <BarChart bars={stats.bars} label="Broj porudžbina po danu" integer />
          </Card>
          <Card
            title="Najprodavaniji proizvodi"
            extra={
              <span style={{ display: 'flex', gap: 4 }}>
                <Btn size="sm" variant={topN === 5 ? 'secondary' : 'outline'} onClick={() => setTopN(5)}>
                  Top 5
                </Btn>
                <Btn size="sm" variant={topN === 10 ? 'secondary' : 'outline'} onClick={() => setTopN(10)}>
                  Top 10
                </Btn>
              </span>
            }
          >
            {stats.top.length ? (
              <ol className={s.topList}>
                {stats.top.slice(0, topN).map((t) => (
                  <li key={t.name}>
                    <div className={s.topName}>
                      <button onClick={() => t.productId && openProduct(t.productId)} title={t.name}>
                        {t.name}
                      </button>
                      <div className={s.meter} aria-hidden="true">
                        <span style={{ width: `${(t.qty / maxTop) * 100}%` }} />
                      </div>
                    </div>
                    <span className={s.topVal}>{t.qty} kom</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">Nema prodaje u ovom periodu.</p>
            )}
            <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--vn-color-text-muted)' }}>Po prodatim komadima, bez otkazanih porudžbina. Pomaže da planirate šta DA treba da uveze.</p>
          </Card>
        </div>
        <Card title="Treba pažnje">
          {attention.length ? (
            <ul className={s.attention}>
              {attention.map((a) => (
                <li key={a.title}>
                  <a href={a.to}>
                    <span className={`${s.attIcon} ${a.tone === 'error' ? s.attError : a.tone === 'warn' ? s.attWarn : s.attInfo}`}>
                      <AdminIcon name={a.icon} size={17} />
                    </span>
                    <span className={s.attText}>
                      <strong>{a.title}</strong>
                      {a.sub && <span>{a.sub}</span>}
                    </span>
                    <AdminIcon name="chevronRight" size={16} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.allGood}>
              <AdminIcon name="check" /> Sve je u redu.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
