import { useEffect, useState, type ReactNode } from 'react';
import { url } from '../../lib/url';
import { useAdmin } from '../AdminContext';
import { href } from '../router';
import { AdminIcon, type AdminIconName } from './AdminIcon';
import { Btn, cx, useAction, useToast } from './ui';
import s from './Shell.module.css';

const nav: { id: string; label: string; icon: AdminIconName; to: string }[] = [
  { id: '', label: 'Kontrolna tabla', icon: 'dashboard', to: href() },
  { id: 'porudzbine', label: 'Porudžbine', icon: 'orders', to: href('porudzbine') },
  { id: 'kupci', label: 'Kupci', icon: 'users', to: href('kupci') },
  { id: 'proizvodi', label: 'Proizvodi', icon: 'box', to: href('proizvodi') },
  { id: 'provizija', label: 'Provizija', icon: 'percent', to: href('provizija') },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone', to: href('marketing') },
  { id: 'emailovi', label: 'Emailovi', icon: 'mail', to: href('emailovi') },
  { id: 'podesavanja', label: 'Podešavanja', icon: 'settings', to: href('podesavanja') },
];

export function Shell({ section, children, onSignOut }: { section: string; children: ReactNode; onSignOut: () => void }) {
  const { api, email, unpublished, markPublished } = useAdmin();
  const [open, setOpen] = useState(false);
  const [newOrders, setNewOrders] = useState(0);
  const toast = useToast();
  const { busy, run } = useAction();

  useEffect(() => setOpen(false), [section]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .listOrders()
        .then((o) => alive && setNewOrders(o.filter((x) => x.status === 'new').length))
        .catch(() => {});
    load();
    const t = setInterval(load, 120000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [api]);

  const publish = () =>
    run(async () => {
      const r = await api.republish();
      if (r.ok) {
        markPublished();
        toast('Objava je pokrenuta. Sajt će biti osvežen za 2–3 minuta.');
      } else if (r.reason === 'not_configured') {
        toast('Objava još nije podešena: u Supabase treba dodati GitHub token (vidi Podešavanja → Objava sajta).', true);
      } else {
        toast(`Objava nije uspela: ${r.detail ?? ''}`, true);
      }
    });

  return (
    <div className={s.app}>
      <a href="#main" className="vn-skip-link">
        Preskoči na sadržaj
      </a>
      <aside className={cx(s.sidebar, open && s.sidebarOpen)} aria-label="Glavni meni">
        <div className={s.brand}>
          <img src={url('images/brand/vodanatura-logo.svg')} alt="VodaNatura" width={150} height={33} />
          <span>Admin</span>
        </div>
        <nav>
          <ul className={s.nav}>
            {nav.map((n) => (
              <li key={n.id}>
                <a href={n.to} className={cx(s.navItem, section === n.id && s.navActive)} aria-current={section === n.id ? 'page' : undefined}>
                  <AdminIcon name={n.icon} size={19} />
                  <span>{n.label}</span>
                  {n.id === 'porudzbine' && newOrders > 0 && <span className={s.badge} aria-label={`${newOrders} novih`}>{newOrders}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.sideFoot}>
          <a href={url('')} target="_blank" rel="noreferrer" className={s.navItem}>
            <AdminIcon name="external" size={19} />
            <span>Otvori prodavnicu</span>
          </a>
        </div>
      </aside>
      {open && <div className={s.scrim} onClick={() => setOpen(false)} />}

      <div className={s.main}>
        <header className={s.topbar}>
          <Btn variant="ghost" icon="menu" iconOnly aria-label="Meni" className={s.menuBtn} onClick={() => setOpen(true)} />
          {api.demo && <span className={s.demo}>Demo podaci</span>}
          <div className={s.topRight}>
            <Btn
              variant={unpublished ? 'primary' : 'outline'}
              size="sm"
              icon="globe"
              busy={busy}
              onClick={publish}
              title="Prodavnica je statičan sajt: izmene cena, zaliha i tekstova se vide posle objave."
            >
              {unpublished ? 'Objavi izmene na sajtu' : 'Objavi sajt'}
            </Btn>
            <span className={s.user}>{email}</span>
            <Btn variant="ghost" size="sm" icon="logout" onClick={onSignOut}>
              Odjava
            </Btn>
          </div>
        </header>
        <main id="main" className={s.content} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
