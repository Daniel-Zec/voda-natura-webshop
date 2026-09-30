import { useRef, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { AdminIcon } from '../components/AdminIcon';
import { imgSrc } from '../components/ProductBits';
import { Btn, Card, Check, Empty, Field, Input, Loading, Modal, Notice, PageHeader, Pill, Select, TextArea, ui, useAction, useLoad } from '../components/ui';
import { date } from '../lib/labels';
import type { Banner } from '../lib/types';
import s from './screens.module.css';

const placementLabel: Record<Banner['placement'], string> = { hero: 'Glavni baner (hero)', promo: 'Promo baner', announcement: 'Traka sa obaveštenjem' };

function bannerStatus(b: Banner): { label: string; tone: 'success' | 'info' | 'neutral' | 'warning' } {
  if (b.is_draft) return { label: 'Nacrt', tone: 'neutral' };
  const now = Date.now();
  if (b.starts_at && Date.parse(b.starts_at) > now) return { label: `Zakazan od ${date(b.starts_at)}`, tone: 'info' };
  if (b.ends_at && Date.parse(b.ends_at) <= now) return { label: 'Istekao', tone: 'warning' };
  return { label: 'Aktivan', tone: 'success' };
}

const empty: Omit<Banner, 'id'> = { placement: 'promo', title: '', body: '', button_label: '', button_url: '', image_desktop: null, image_mobile: null, starts_at: null, ends_at: null, is_draft: true, sort_order: 0 };

export function Marketing() {
  const { api, markChanged } = useAdmin();
  const { data, error, reload } = useLoad(() => api.listBanners(), [api]);
  const [edit, setEdit] = useState<(Omit<Banner, 'id'> & { id?: number }) | null>(null);
  const { busy, run } = useAction();

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Loading />;

  return (
    <>
      <PageHeader
        title="Marketing"
        subtitle="Glavni baner, promo baneri i traka sa obaveštenjem. Sa datumima se sami uključuju i isključuju."
        actions={
          <Btn variant="primary" icon="plus" onClick={() => setEdit({ ...empty })}>
            Novi baner
          </Btn>
        }
      />
      <Notice tone="info">Prodavnica još ne čita banere iz baze: početna strana koristi tekst iz dizajna. Povezivanje dolazi sa sledećom izmenom početne strane.</Notice>
      <div className={ui.stack} style={{ marginTop: 16 }}>
        {data.length ? (
          (['hero', 'promo', 'announcement'] as const).map((pl) => {
            const list = data.filter((b) => b.placement === pl);
            if (!list.length) return null;
            return (
              <Card key={pl} title={placementLabel[pl]}>
                <div className={ui.stack}>
                  {list.map((b) => {
                    const st = bannerStatus(b);
                    return (
                      <div key={b.id} className={s.bannerCard}>
                        {b.image_desktop ? <img src={imgSrc(b.image_desktop)} alt="" /> : <span className={s.bannerNoImg}><AdminIcon name="image" /></span>}
                        <div>
                          <div className={ui.cellTitle}>{b.title}</div>
                          <div className={ui.cellSub}>{b.body}</div>
                          <div className={ui.row} style={{ marginTop: 6, gap: 8 }}>
                            <Pill tone={st.tone}>{st.label}</Pill>
                            <span className={ui.small}>
                              {b.starts_at || b.ends_at ? `${date(b.starts_at) === '—' ? 'odmah' : date(b.starts_at)} – ${date(b.ends_at) === '—' ? 'bez kraja' : date(b.ends_at)}` : 'bez rasporeda'}
                            </span>
                          </div>
                        </div>
                        <div className={ui.row} style={{ gap: 4 }}>
                          <Btn size="sm" onClick={() => setEdit(structuredClone(b))}>
                            Izmeni
                          </Btn>
                          <Btn size="sm" variant="ghost" icon="trash" iconOnly aria-label="Obriši" busy={busy} onClick={() => window.confirm('Obrisati baner?') && run(async () => (await api.deleteBanner(b.id), markChanged(), reload()), 'Baner obrisan')} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        ) : (
          <Card>
            <Empty icon="megaphone" title="Još nema banera" />
          </Card>
        )}
      </div>
      {edit && (
        <BannerEditor
          banner={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            markChanged();
            reload();
          }}
        />
      )}
    </>
  );
}

function BannerEditor({ banner, onClose, onSaved }: { banner: Omit<Banner, 'id'> & { id?: number }; onClose: () => void; onSaved: () => void }) {
  const { api } = useAdmin();
  const [b, setB] = useState(banner);
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const { busy, run } = useAction();
  const deskRef = useRef<HTMLInputElement>(null);
  const mobRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Banner>(k: K, v: Banner[K]) => setB((x) => ({ ...x, [k]: v }));
  const toLocal = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
  const upload = (f: File | undefined, key: 'image_desktop' | 'image_mobile') => f && run(async () => set(key, await api.uploadFile('banners', f)));
  const img = view === 'mobile' ? b.image_mobile ?? b.image_desktop : b.image_desktop;
  const noShipping = /besplatn\w* dostav|dostava gratis|free shipping/i.test(`${b.title} ${b.body} ${b.button_label}`);

  return (
    <Modal
      wide
      title={b.id ? 'Izmena banera' : 'Novi baner'}
      onClose={onClose}
      dirty={JSON.stringify(b) !== JSON.stringify(banner)}
      footer={
        <>
          <Btn onClick={onClose}>Odustani</Btn>
          <Btn variant="primary" busy={busy} disabled={!b.title.trim() || noShipping} onClick={() => run(async () => (await api.saveBanner(b), onSaved()), 'Baner sačuvan')}>
            Sačuvaj
          </Btn>
        </>
      }
    >
      <div className={s.cols} style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
        <div className={ui.stack}>
          <Field label="Mesto">
            {(id) => (
              <Select id={id} value={b.placement} onChange={(e) => set('placement', e.target.value as Banner['placement'])}>
                {Object.entries(placementLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Naslov">{(id) => <Input id={id} value={b.title} onChange={(e) => set('title', e.target.value)} />}</Field>
          <Field label="Tekst">{(id) => <TextArea id={id} rows={2} value={b.body ?? ''} onChange={(e) => set('body', e.target.value)} />}</Field>
          <div className={ui.grid2}>
            <Field label="Tekst dugmeta">{(id) => <Input id={id} value={b.button_label ?? ''} onChange={(e) => set('button_label', e.target.value)} />}</Field>
            <Field label="Link dugmeta" hint="Npr. /ulosci/">{(id) => <Input id={id} value={b.button_url ?? ''} onChange={(e) => set('button_url', e.target.value)} />}</Field>
            <Field label="Početak" hint="Prazno = odmah">{(id) => <Input id={id} type="date" value={toLocal(b.starts_at)} onChange={(e) => set('starts_at', e.target.value ? new Date(`${e.target.value}T00:00:00`).toISOString() : null)} />}</Field>
            <Field label="Kraj" hint="Prazno = bez kraja">{(id) => <Input id={id} type="date" value={toLocal(b.ends_at)} onChange={(e) => set('ends_at', e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : null)} />}</Field>
          </div>
          <div className={ui.row}>
            <Btn size="sm" icon="upload" onClick={() => deskRef.current?.click()}>
              Slika za računar
            </Btn>
            <Btn size="sm" icon="upload" onClick={() => mobRef.current?.click()}>
              Slika za telefon
            </Btn>
            <input ref={deskRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0], 'image_desktop')} />
            <input ref={mobRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0], 'image_mobile')} />
          </div>
          <Check label="Nacrt (ne prikazuje se)" checked={b.is_draft} onChange={(v) => set('is_draft', v)} />
          {noShipping && <Notice tone="error">Baneri ne smeju obećavati besplatnu dostavu ni cenu dostave: kupac plaća dostavu kuriru.</Notice>}
        </div>
        <div className={ui.stack}>
          <div className={ui.row}>
            <Btn size="sm" variant={view === 'desktop' ? 'secondary' : 'outline'} onClick={() => setView('desktop')}>
              Računar
            </Btn>
            <Btn size="sm" variant={view === 'mobile' ? 'secondary' : 'outline'} onClick={() => setView('mobile')}>
              Telefon
            </Btn>
          </div>
          <div
            style={{
              width: view === 'mobile' ? 300 : '100%',
              margin: '0 auto',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--vn-color-border-default)',
              background: img ? `center/cover no-repeat url("${imgSrc(img)}")` : 'var(--vn-color-bg-brand-soft)',
              minHeight: view === 'mobile' ? 360 : 220,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ padding: 20, margin: 12, borderRadius: 12, background: 'rgb(255 255 255 / 0.92)', maxWidth: 380 }}>
              <strong style={{ fontSize: view === 'mobile' ? 20 : 24, lineHeight: 1.2, display: 'block' }}>{b.title || 'Naslov banera'}</strong>
              {b.body && <p style={{ margin: '8px 0 0', fontSize: 14 }}>{b.body}</p>}
              {b.button_label && (
                <span className={`${ui.btn} ${ui.primary}`} style={{ marginTop: 12 }}>
                  {b.button_label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
