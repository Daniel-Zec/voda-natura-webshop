import { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Btn, Card, Field, Input, Loading, Notice, PageHeader, ui, useAction } from '../components/ui';
import { dateTime, settingText } from '../lib/labels';
import { href } from '../router';
import s from './screens.module.css';

const textKeys = ['shop_phone', 'shop_hours', 'delivery_estimate', 'installation_phone', 'installation_price'] as const;
const numKeys = ['commission_earn_days', 'price_rounding_rsd', 'order_stuck_days', 'stock_import_warn_days', 'admin_idle_minutes'] as const;

export function Settings() {
  const { api, catalog, reloadCatalog, email, markChanged } = useAdmin();
  const [v, setV] = useState<Record<string, string> | null>(null);
  const { busy, run } = useAction();

  useEffect(() => {
    if (catalog && !v) setV(Object.fromEntries([...textKeys, ...numKeys].map((k) => [k, settingText(catalog.settings, k)])));
  }, [catalog, v]);
  if (!catalog || !v) return <Loading />;

  const placeholder = (x: string) => /\[.*\]/.test(x);
  const changed = [...textKeys, ...numKeys].filter((k) => v[k] !== settingText(catalog.settings, k));
  const bad = numKeys.filter((k) => v[k] !== '' && !(Number(v[k]) >= 0));
  const save = () =>
    run(async () => {
      const out: Record<string, unknown> = {};
      for (const k of changed) out[k] = (numKeys as readonly string[]).includes(k) ? (v[k] === '' ? null : Number(v[k])) : v[k];
      await api.saveSettings(out);
      if (changed.some((k) => (textKeys as readonly string[]).includes(k))) markChanged();
      await reloadCatalog();
    }, 'Podešavanja sačuvana');

  const field = (k: string, label: string, hint?: string, suffix?: string) => (
    <Field label={label} hint={hint} error={placeholder(v[k]) ? 'Još nije uneto (prikazuje se kao placeholder).' : undefined}>
      {(id) =>
        suffix ? (
          <div className={ui.inputSuffix}>
            <Input id={id} inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
            <span>{suffix}</span>
          </div>
        ) : (
          <Input id={id} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
        )
      }
    </Field>
  );

  return (
    <>
      <PageHeader
        title="Podešavanja"
        actions={
          <Btn variant="primary" icon="check" busy={busy} disabled={!changed.length || bad.length > 0} onClick={save}>
            Sačuvaj {changed.length ? `(${changed.length})` : ''}
          </Btn>
        }
      />
      <div className={s.cols}>
        <div className={s.stack}>
          <Card title="Podaci prodavnice" extra={<small>vide se u prodavnici</small>}>
            <div className={ui.grid2}>
              {field('shop_phone', 'Telefon za pomoć')}
              {field('shop_hours', 'Radno vreme')}
              {field('delivery_estimate', 'Rok isporuke', 'Npr. „oko 4 radna dana”.')}
              {field('installation_phone', 'Telefon DA za ugradnju (Subotica)')}
              {field('installation_price', 'Cena ugradnje u Subotici')}
            </div>
          </Card>
          <Card title="Provizija i cene">
            <div className={ui.grid2}>
              {field('commission_earn_days', 'Provizija je zarađena posle', 'Broj dana od isporuke.', 'dana')}
              {field('price_rounding_rsd', 'Zaokruživanje procentualnih cena', undefined, 'RSD')}
            </div>
            <p className={ui.small} style={{ color: 'var(--vn-color-text-muted)' }}>
              Podrazumevani procenat provizije podešava se u <a href={href('provizija', 'stope')}>Provizija → Stope</a>.
            </p>
          </Card>
          <Card title="Kontrolna tabla">
            <div className={ui.grid2}>
              {field('order_stuck_days', 'Upozori ako porudžbina stoji u istom statusu duže od', undefined, 'dana')}
              {field('stock_import_warn_days', 'Upozori ako je uvoz zaliha stariji od', undefined, 'dana')}
            </div>
          </Card>
        </div>
        <div className={s.stack}>
          <Card title="Nalog">
            <dl className={ui.dl}>
              <dt>Prijavljeni ste kao</dt>
              <dd>{email}</dd>
              <dt>Prijava u dva koraka</dt>
              <dd>Uključena (aplikacija za kodove)</dd>
            </dl>
            <div style={{ marginTop: 16 }}>{field('admin_idle_minutes', 'Automatska odjava posle neaktivnosti', undefined, 'min')}</div>
            <p className={ui.small} style={{ color: 'var(--vn-color-text-muted)' }}>
              Lozinku menjate preko „Zaboravili ste lozinku?” na ekranu za prijavu.
            </p>
          </Card>
          <Card title="Čitanje cena sa decorambient.com">
            <dl className={ui.dl}>
              <dt>Raspored</dt>
              <dd>jednom dnevno</dd>
              <dt>Poslednje čitanje</dt>
              <dd>{catalog.settings.price_sync_last_run ? dateTime(String(catalog.settings.price_sync_last_run)) : 'još nije pokrenuto'}</dd>
            </dl>
          </Card>
          <Card title="Objava sajta">
            <p style={{ marginTop: 0 }}>
              Prodavnica je statičan sajt. Izmene cena, zaliha, tekstova i slika vide se kupcima posle objave (dugme „Objavi” gore desno, traje 2–3 minuta).
            </p>
            <Notice tone="info">
              Jednokratno podešavanje: u Supabase → Edge Functions → Secrets dodajte <code>GITHUB_TOKEN</code> (GitHub token samo za ovaj repozitorijum, dozvola „Actions: read and write”).
            </Notice>
          </Card>
          <Card title="Pravno">
            <p style={{ margin: 0 }}>Prodavac na računu kupca je Decor Ambient. Pravne stranice čekaju advokata (VODANATURA-42).</p>
          </Card>
        </div>
      </div>
    </>
  );
}
