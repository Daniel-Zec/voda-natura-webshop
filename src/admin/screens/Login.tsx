import { useState } from 'react';

type FormEvent = { preventDefault(): void };
import { url } from '../../lib/url';
import type { AdminApi } from '../lib/api';
import type { AuthStep } from '../lib/types';
import { Btn, Field, Input, Notice } from '../components/ui';
import s from './Login.module.css';

type Mode = 'login' | 'forgot' | 'newPassword';

/** Sign-in with password, then the second step (authenticator app). No public sign-up. */
export function Login({ api, step, onStep, recovery, reason }: { api: AdminApi; step: AuthStep; onStep: (s: AuthStep) => void; recovery: boolean; reason?: string }) {
  const [mode, setMode] = useState<Mode>(recovery ? 'newPassword' : 'login');
  const [email, setEmail] = useState('admin@vodanatura.com');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(reason ?? null);
  const [enroll, setEnroll] = useState<{ factorId: string; qrSvg: string; secret: string } | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(
        /invalid login/i.test(m)
          ? 'Pogrešan email ili lozinka.'
          : /invalid totp|invalid code|expired/i.test(m)
            ? 'Kod nije ispravan ili je istekao. Upišite novi kod iz aplikacije.'
            : /rate limit|too many/i.test(m)
              ? 'Previše pokušaja. Sačekajte nekoliko minuta pa pokušajte ponovo.'
              : m,
      );
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = (e: FormEvent) => {
    e.preventDefault();
    run(async () => onStep(await api.auth.signIn(email.trim(), password)));
  };
  const submitForgot = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api.auth.resetPassword(email.trim());
      setInfo('Ako nalog postoji, poslali smo link za novu lozinku na taj email.');
      setMode('login');
    });
  };
  const submitNewPassword = (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 10) return setError('Lozinka mora imati najmanje 10 znakova.');
    if (password !== password2) return setError('Lozinke se ne poklapaju.');
    run(async () => {
      await api.auth.updatePassword(password);
      history.replaceState(null, '', window.location.pathname + '#/');
      setInfo('Lozinka je promenjena.');
      setMode('login');
      onStep(await api.auth.current());
    });
  };
  const startEnroll = () => run(async () => setEnroll(await api.auth.enrollTotp()));
  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    const factorId = step.step === 'challenge' ? step.factorId : enroll?.factorId;
    if (!factorId) return;
    run(async () => onStep(await api.auth.verifyTotp(factorId, code.replace(/\s/g, ''))));
  };

  let body;
  if (mode === 'newPassword') {
    body = (
      <form onSubmit={submitNewPassword} className={s.form}>
        <h1>Nova lozinka</h1>
        <Field label="Nova lozinka" hint="Najmanje 10 znakova.">
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        <Field label="Ponovite lozinku">
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} required />}
        </Field>
        <Btn type="submit" variant="primary" busy={busy}>
          Sačuvaj lozinku
        </Btn>
      </form>
    );
  } else if (step.step === 'not_admin') {
    body = (
      <div className={s.form}>
        <h1>Nemate pristup</h1>
        <p className={s.lead}>
          Nalog <strong>{step.email}</strong> nije na listi administratora.
        </p>
        <Btn onClick={() => run(async () => (await api.auth.signOut(), onStep({ step: 'signed_out' })))}>Odjava</Btn>
      </div>
    );
  } else if (step.step === 'enroll') {
    body = enroll ? (
      <form onSubmit={submitCode} className={s.form}>
        <h1>Uključite prijavu u dva koraka</h1>
        <ol className={s.steps}>
          <li>Otvorite aplikaciju za kodove na telefonu (Google Authenticator, Microsoft Authenticator ili 1Password).</li>
          <li>Skenirajte QR kod ili upišite ključ ručno.</li>
          <li>Upišite šestocifreni kod iz aplikacije.</li>
        </ol>
        {enroll.qrSvg && <img className={s.qr} src={enroll.qrSvg} alt="QR kod za aplikaciju za kodove" width={180} height={180} />}
        <p className={s.secret}>
          Ključ: <code>{enroll.secret}</code>
        </p>
        <Field label="Kod iz aplikacije">
          {(id) => <Input id={id} inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />}
        </Field>
        <Btn type="submit" variant="primary" busy={busy}>
          Potvrdi
        </Btn>
      </form>
    ) : (
      <div className={s.form}>
        <h1>Prijava u dva koraka</h1>
        <p className={s.lead}>Admin panel se otvara samo uz kod iz aplikacije na telefonu. Podešava se jednom, traje minut.</p>
        <Btn variant="primary" busy={busy} onClick={startEnroll}>
          Podesi aplikaciju za kodove
        </Btn>
        <Btn variant="ghost" onClick={() => run(async () => (await api.auth.signOut(), onStep({ step: 'signed_out' })))}>
          Odjava
        </Btn>
      </div>
    );
  } else if (step.step === 'challenge') {
    body = (
      <form onSubmit={submitCode} className={s.form}>
        <h1>Kod iz aplikacije</h1>
        <p className={s.lead}>Upišite šestocifreni kod iz aplikacije za kodove.</p>
        <Field label="Kod">
          {(id) => <Input id={id} inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />}
        </Field>
        <Btn type="submit" variant="primary" busy={busy}>
          Potvrdi
        </Btn>
        <Btn variant="ghost" onClick={() => run(async () => (await api.auth.signOut(), onStep({ step: 'signed_out' })))}>
          Prijava drugim nalogom
        </Btn>
      </form>
    );
  } else if (mode === 'forgot') {
    body = (
      <form onSubmit={submitForgot} className={s.form}>
        <h1>Zaboravljena lozinka</h1>
        <p className={s.lead}>Poslaćemo link za novu lozinku.</p>
        <Field label="Email">
          {(id) => <Input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Btn type="submit" variant="primary" busy={busy}>
          Pošalji link
        </Btn>
        <Btn variant="ghost" onClick={() => setMode('login')}>
          Nazad na prijavu
        </Btn>
      </form>
    );
  } else {
    body = (
      <form onSubmit={submitLogin} className={s.form}>
        <h1>Prijava</h1>
        <Field label="Email">
          {(id) => <Input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <Field label="Lozinka">
          {(id) => <Input id={id} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />}
        </Field>
        <Btn type="submit" variant="primary" busy={busy}>
          Prijavi se
        </Btn>
        <button type="button" className={s.link} onClick={() => setMode('forgot')}>
          Zaboravili ste lozinku?
        </button>
      </form>
    );
  }

  return (
    <main className={s.page}>
      <div className={s.box}>
        <img src={url('images/brand/vodanatura-logo.svg')} alt="VodaNatura" className={s.logo} width={180} height={40} />
        <p className={s.kicker}>Admin panel</p>
        {info && <Notice tone="info">{info}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {body}
      </div>
    </main>
  );
}
