import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminProvider, useAdmin } from './AdminContext';
import { Shell } from './components/Shell';
import { Loading, Notice, ToastProvider } from './components/ui';
import { getApi, type AdminApi } from './lib/api';
import { settingNumber } from './lib/labels';
import type { AuthStep } from './lib/types';
import { useRoute } from './router';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { Orders } from './screens/Orders';
import { OrderDetail } from './screens/OrderDetail';
import { Customers } from './screens/Customers';
import { CustomerDetail } from './screens/CustomerDetail';
import { Products } from './screens/Products';
import { Gallery } from './screens/Gallery';
import { StockImport } from './screens/StockImport';
import { Prices } from './screens/Prices';
import { ProductModal } from './screens/ProductModal';
import { CommissionSummary } from './screens/CommissionSummary';
import { CommissionRates } from './screens/CommissionRates';
import { Marketing } from './screens/Marketing';
import { Emails } from './screens/Emails';
import { Settings } from './screens/Settings';

/** Entry point of the admin panel (mounted by src/pages/admin/index.astro). */
export default function AdminApp() {
  const [api, setApi] = useState<AdminApi | null>(null);
  const [step, setStep] = useState<AuthStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | undefined>();
  const recovery = typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

  useEffect(() => {
    getApi()
      .then(async (a) => {
        setApi(a);
        setStep(await a.auth.current());
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    if (!api) return;
    return api.auth.onSignedOut(() => setStep({ step: 'signed_out' }));
  }, [api]);

  const signOut = useCallback(
    async (why?: string) => {
      if (!api) return;
      await api.auth.signOut();
      setReason(why);
      setStep({ step: 'signed_out' });
    },
    [api],
  );

  if (error)
    return (
      <div style={{ padding: 24 }}>
        <Notice tone="error">Admin panel nije mogao da se pokrene: {error}</Notice>
      </div>
    );
  if (!api || !step) return <Loading label="Pokrećem admin panel…" />;

  return (
    <ToastProvider>
      {step.step === 'ready' && !recovery ? (
        <AdminProvider api={api} email={step.email}>
          <IdleLogout onIdle={() => signOut('Odjavljeni ste zbog neaktivnosti.')} />
          <Routes onSignOut={() => signOut()} />
        </AdminProvider>
      ) : (
        <Login api={api} step={step} onStep={setStep} recovery={recovery} reason={reason} />
      )}
    </ToastProvider>
  );
}

function IdleLogout({ onIdle }: { onIdle: () => void }) {
  const { catalog } = useAdmin();
  const minutes = catalog ? settingNumber(catalog.settings, 'admin_idle_minutes', 30) : 30;
  const last = useRef(Date.now());
  useEffect(() => {
    const bump = () => (last.current = Date.now());
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      if (Date.now() - last.current > minutes * 60000) onIdle();
    }, 30000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(t);
    };
  }, [minutes, onIdle]);
  return null;
}

function Routes({ onSignOut }: { onSignOut: () => void }) {
  const { segments, query } = useRoute();
  const { openProductId, closeProduct, catalogError } = useAdmin();
  const [section = '', sub, third] = segments;

  let screen;
  switch (section) {
    case '':
      screen = <Dashboard />;
      break;
    case 'porudzbine':
      screen = sub ? <OrderDetail id={Number(sub)} /> : <Orders initialStatus={query.get('status') ?? ''} />;
      break;
    case 'kupci':
      screen = sub ? <CustomerDetail email={sub} /> : <Customers />;
      break;
    case 'proizvodi':
      screen =
        sub === 'galerija' ? <Gallery /> : sub === 'zalihe' ? <StockImport /> : sub === 'cene' ? <Prices /> : <Products initialFilter={query.get('filter') ?? ''} />;
      break;
    case 'provizija':
      screen = sub === 'stope' ? <CommissionRates /> : <CommissionSummary />;
      break;
    case 'marketing':
      screen = <Marketing />;
      break;
    case 'emailovi':
      screen = <Emails tab={sub ?? 'sabloni'} />;
      break;
    case 'podesavanja':
      screen = <Settings />;
      break;
    default:
      screen = <Notice tone="warning">Stranica ne postoji. <a href="#/">Nazad na kontrolnu tablu</a>.</Notice>;
  }
  void third;

  return (
    <Shell section={section} onSignOut={onSignOut}>
      {catalogError && (
        <div style={{ marginBottom: 16 }}>
          <Notice tone="error">Podaci nisu učitani: {catalogError}</Notice>
        </div>
      )}
      {screen}
      {openProductId !== null && <ProductModal id={openProductId} onClose={closeProduct} />}
    </Shell>
  );
}
