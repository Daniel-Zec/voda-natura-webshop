import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Btn, DataTable, Empty, Loading, Modal, Notice, PageHeader, Pill, SearchInput, Tabs, ui, useAction, useLoad, useToast, type Column } from '../components/ui';
import { contactStatusLabel, contactStatusTone, contactTopicLabel, dateTime, downloadCsv } from '../lib/labels';
import type { ContactMessage, ContactStatus } from '../lib/types';
import { href } from '../router';

const tabs: { id: '' | ContactStatus; label: string }[] = [
  { id: '', label: 'Sve' },
  { id: 'new', label: 'Nove' },
  { id: 'answered', label: 'Odgovoreno' },
  { id: 'forwarded', label: 'Prosleđeno' },
  { id: 'spam', label: 'Spam' },
];

const preview = (text: string, n = 90) => (text.length > n ? `${text.slice(0, n).trimEnd()}…` : text);

/** Text of the message for replies and forwards. */
function quoted(m: ContactMessage) {
  return [
    `Poruka sa sajta VodaNatura (${dateTime(m.created_at)})`,
    `Ime: ${m.name}`,
    `Email: ${m.email}`,
    m.phone ? `Telefon: ${m.phone}` : null,
    `Tema: ${contactTopicLabel[m.topic]}`,
    '',
    m.message,
  ]
    .filter((l) => l !== null)
    .join('\n');
}
const mailto = (to: string, subject: string, body: string) =>
  `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/**
 * "Poruke": messages from the contact form on /kontakt/. Nothing is emailed; Daniel reads them
 * here, answers from his mail app ("Odgovori") or forwards to Decor Ambient ("Prosledi").
 */
export function Messages({ status }: { status: string }) {
  const { api } = useAdmin();
  const [reload, setReload] = useState(0);
  const { data, error } = useLoad(() => api.listMessages(), [api, reload]);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const active = (tabs.find((t) => t.id === status)?.id ?? '') as '' | ContactStatus;

  const counts = useMemo(() => {
    const c: Record<string, number> = { '': 0 };
    for (const m of data ?? []) {
      c[m.status] = (c[m.status] ?? 0) + 1;
      if (m.status !== 'spam') c[''] += 1;
    }
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data ?? []).filter(
      (m) =>
        (active ? m.status === active : m.status !== 'spam') &&
        (!n || [m.name, m.email, m.phone, m.message].some((v) => (v ?? '').toLowerCase().includes(n))),
    );
  }, [data, q, active]);

  const columns: Column<ContactMessage>[] = [
    { key: 'date', header: 'Primljeno', render: (m) => <span className={ui.nowrap}>{dateTime(m.created_at)}</span>, sort: (m) => m.created_at },
    {
      key: 'from',
      header: 'Od',
      render: (m) => (
        <>
          <div className={ui.cellTitle}>{m.status === 'new' ? <strong>{m.name}</strong> : m.name}</div>
          <div className={ui.cellSub}>{m.email}</div>
        </>
      ),
      sort: (m) => m.name,
    },
    { key: 'topic', header: 'Tema', render: (m) => contactTopicLabel[m.topic], sort: (m) => m.topic },
    { key: 'text', header: 'Poruka', render: (m) => <span className={ui.cellSub}>{preview(m.message)}</span> },
    { key: 'status', header: 'Status', render: (m) => <Pill tone={contactStatusTone[m.status]}>{contactStatusLabel[m.status]}</Pill>, sort: (m) => m.status },
  ];

  if (error)
    return (
      <>
        <PageHeader title="Poruke" />
        <Notice tone="error">
          Poruke nisu učitane: {error}. Ako se pominje „contact_messages", tabela još nije napravljena u Supabase (vidi docs/admin-panel.md → Poruke).
        </Notice>
      </>
    );
  if (!data) return <Loading />;
  const open = data.find((m) => m.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title="Poruke"
        subtitle="Poruke sa kontakt forme na sajtu (/kontakt/). Odgovarate iz svog emaila, a za Decor Ambient koristite „Prosledi“."
        actions={
          <Btn
            icon="download"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv('poruke.csv', [
                ['Primljeno', 'Ime', 'Email', 'Telefon', 'Tema', 'Status', 'Poruka', 'Stranica'],
                ...rows.map((m) => [dateTime(m.created_at), m.name, m.email, m.phone, contactTopicLabel[m.topic], contactStatusLabel[m.status], m.message, m.page]),
              ])
            }
          >
            Izvoz CSV
          </Btn>
        }
      />
      <Tabs items={tabs.map((t) => ({ id: t.id, label: t.label, href: t.id ? href('poruke', t.id) : href('poruke'), count: counts[t.id] ?? 0 }))} active={active} />
      <div className={ui.toolbar}>
        <SearchInput value={q} onChange={setQ} placeholder="Ime, email, telefon ili tekst poruke" />
      </div>
      <DataTable
        label="Poruke"
        rows={rows}
        columns={columns}
        rowKey={(m) => m.id}
        onRowClick={(m) => setOpenId(m.id)}
        initialSort={{ key: 'date', dir: 'desc' }}
        empty={
          <Empty icon="inbox" title={active ? 'Nema poruka sa ovim statusom' : 'Još nema poruka'}>
            Poruke stižu sa stranice Kontakt na sajtu.
          </Empty>
        }
      />
      {open && <MessageModal message={open} onClose={() => setOpenId(null)} onChanged={() => setReload((n) => n + 1)} />}
    </>
  );
}

function MessageModal({ message: m, onClose, onChanged }: { message: ContactMessage; onClose: () => void; onChanged: () => void }) {
  const { api } = useAdmin();
  const toast = useToast();
  const { busy, run } = useAction();

  const setStatus = (status: ContactStatus) =>
    run(async () => {
      await api.setMessageStatus([m.id], status);
      toast(`Označeno: ${contactStatusLabel[status]}.`);
      onChanged();
    });

  const remove = () => {
    if (!window.confirm('Obrisati ovu poruku? Ovo ne može da se poništi.')) return;
    run(async () => {
      await api.deleteMessage(m.id);
      toast('Poruka je obrisana.');
      onChanged();
      onClose();
    });
  };

  const replyHref = mailto(m.email, `Re: Vaša poruka – VodaNatura`, `Poštovani/a ${m.name.split(' ')[0]},\n\n\n\n---\n${quoted(m)}`);
  const forwardHref = mailto('', `Fwd: Poruka sa sajta – ${m.name} (${contactTopicLabel[m.topic]})`, quoted(m));

  return (
    <Modal
      title={m.name}
      subtitle={`${dateTime(m.created_at)} · ${contactTopicLabel[m.topic]}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" icon="trash" onClick={remove} disabled={busy}>
            Obriši
          </Btn>
          <span style={{ flex: 1 }} />
          {m.status !== 'spam' && (
            <Btn onClick={() => setStatus('spam')} disabled={busy}>
              Spam
            </Btn>
          )}
          {m.status !== 'new' && (
            <Btn onClick={() => setStatus('new')} disabled={busy}>
              Vrati na „Nova“
            </Btn>
          )}
          <Btn icon="forward" href={forwardHref} onClick={() => setStatus('forwarded')}>
            Prosledi
          </Btn>
          <Btn variant="primary" icon="send" href={replyHref} onClick={() => setStatus('answered')}>
            Odgovori
          </Btn>
        </>
      }
    >
      <dl className={ui.dl}>
        <dt>Status</dt>
        <dd>
          <Pill tone={contactStatusTone[m.status]}>{contactStatusLabel[m.status]}</Pill>
        </dd>
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${m.email}`}>{m.email}</a>
        </dd>
        <dt>Telefon</dt>
        <dd>{m.phone ? <a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>{m.phone}</a> : '—'}</dd>
        <dt>Stranica</dt>
        <dd>{m.page ?? '—'}</dd>
      </dl>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: 16, lineHeight: 1.55 }}>{m.message}</p>
      <p className={ui.cellSub} style={{ marginTop: 16 }}>
        „Odgovori“ i „Prosledi“ otvaraju vaš email program sa popunjenom porukom i označavaju poruku kao odgovorenu ili prosleđenu.
      </p>
    </Modal>
  );
}
