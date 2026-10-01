import {
  type MouseEventHandler,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AdminIcon, type AdminIconName } from './AdminIcon';
import type { Tone } from '../lib/labels';
import s from './ui.module.css';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { s as ui };

/* Button ------------------------------------------------------------------ */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  icon?: AdminIconName;
  iconOnly?: boolean;
  busy?: boolean;
  href?: string;
};
export function Btn({ variant = 'outline', size = 'md', icon, iconOnly, busy, children, className, href, type = 'button', ...rest }: BtnProps) {
  const cls = cx(s.btn, s[variant], size === 'sm' && s.sm, iconOnly && s.iconOnly, className);
  const inner = (
    <>
      {busy ? <span className={s.spinner} style={{ width: 14, height: 14 }} /> : icon && <AdminIcon name={icon} size={size === 'sm' ? 15 : 17} />}
      {!iconOnly && children}
    </>
  );
  if (href)
    return (
      <a
        className={cls}
        href={href}
        title={rest.title}
        aria-label={rest['aria-label']}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        onClick={rest.onClick as unknown as MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {inner}
      </a>
    );
  return (
    <button type={type} className={cls} disabled={busy || rest.disabled} {...rest}>
      {inner}
    </button>
  );
}

/* Pill -------------------------------------------------------------------- */
export function Pill({ tone = 'neutral', children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return <span className={cx(s.pill, s[`tone-${tone}`], !dot && s.noDot)}>{children}</span>;
}

/* Page header ------------------------------------------------------------- */
export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className={s.pageHeader}>
      <div>
        {back && (
          <a className={s.backLink} href={back.href}>
            <AdminIcon name="chevronLeft" size={14} /> {back.label}
          </a>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}

export function Card({ title, extra, children, flush, className }: { title?: ReactNode; extra?: ReactNode; children: ReactNode; flush?: boolean; className?: string }) {
  return (
    <section className={cx(s.card, flush && s.cardFlush, className)}>
      {title && (
        <h2 className={s.cardTitle} style={flush ? { padding: '16px 20px 0' } : undefined}>
          <span>{title}</span>
          {extra}
        </h2>
      )}
      {children}
    </section>
  );
}

/* Tabs (links, so each tab has its own address) --------------------------- */
export function Tabs({ items, active }: { items: { id: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav className={s.tabs} aria-label="Pododeljci">
      {items.map((t) => (
        <a key={t.id} href={t.href} className={cx(s.tab, t.id === active && s.tabActive)} aria-current={t.id === active ? 'page' : undefined}>
          {t.label}
          {t.count !== undefined && <span className={s.tabCount}>{t.count}</span>}
        </a>
      ))}
    </nav>
  );
}

/* Form fields ------------------------------------------------------------- */
export function Field({ label, hint, error, children, className }: { label: ReactNode; hint?: ReactNode; error?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cx(s.field, className)}>
      <label className={s.label} htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {error ? <span className={s.error}>{error}</span> : hint ? <span className={s.hint}>{hint}</span> : null}
    </div>
  );
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(s.input, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(s.select, p.className)} />;
export const TextArea = (p: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) => <textarea {...p} className={cx(s.textarea, p.className)} />;
export function Check({ label, checked, onChange, disabled }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className={s.search}>
      <AdminIcon name="search" size={16} />
      <input className={s.input} type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* Notice ------------------------------------------------------------------ */
export function Notice({ tone = 'info', children, icon }: { tone?: Tone; children: ReactNode; icon?: AdminIconName }) {
  const i: AdminIconName = icon ?? (tone === 'warning' || tone === 'error' ? 'alert' : tone === 'success' ? 'check' : 'info');
  return (
    <div className={cx(s.notice, s[`tone-${tone}`])} role={tone === 'error' ? 'alert' : undefined}>
      <AdminIcon name={i} size={18} />
      <div>{children}</div>
    </div>
  );
}

export function Loading({ label = 'Učitavam…' }: { label?: string }) {
  return (
    <div className={s.loading} role="status">
      <span className={s.spinner} /> {label}
    </div>
  );
}
export function Empty({ icon = 'box', title, children }: { icon?: AdminIconName; title: string; children?: ReactNode }) {
  return (
    <div className={s.empty}>
      <AdminIcon name={icon} size={32} />
      <strong>{title}</strong>
      {children}
    </div>
  );
}

/* KPI --------------------------------------------------------------------- */
export function Kpi({ label, value, delta, hint }: { label: string; value: ReactNode; delta?: number | null; hint?: ReactNode }) {
  return (
    <div className={cx(s.card, s.kpi)}>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{value}</span>
      {delta !== undefined && (
        <span className={cx(s.kpiDelta, delta === null || delta === 0 ? s.deltaFlat : delta > 0 ? s.deltaUp : s.deltaDown)}>
          {delta === null ? (
            'nema poređenja'
          ) : (
            <>
              {delta !== 0 && <AdminIcon name={delta > 0 ? 'arrowUp' : 'arrowDown'} size={13} />}
              {delta > 0 ? '+' : ''}
              {Math.round(delta)} % u odnosu na prethodni period
            </>
          )}
        </span>
      )}
      {hint && <span className={cx(s.hint)}>{hint}</span>}
    </div>
  );
}

/* Modal ------------------------------------------------------------------- */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  dirty,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** Ask before closing when there are unsaved changes. */
  dirty?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useCallback(() => {
    if (dirty && !window.confirm('Imate nesačuvane izmene. Zatvoriti bez čuvanja?')) return;
    onClose();
  }, [dirty, onClose]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [close]);
  return (
    <div className={s.backdrop} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className={cx(s.modal, wide && s.modalWide)} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
        <div className={s.modalHead}>
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <Btn variant="ghost" icon="close" iconOnly aria-label="Zatvori" onClick={close} />
        </div>
        <div className={s.modalBody}>{children}</div>
        {footer && <div className={s.modalFoot}>{footer}</div>}
      </div>
    </div>
  );
}

/* Toasts ------------------------------------------------------------------ */
type ToastItem = { id: number; text: string; error?: boolean };
const ToastCtx = createContext<(text: string, error?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, error }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), error ? 8000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className={s.toasts} aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx(s.toast, t.error && s.toastError)}>
            <AdminIcon name={t.error ? 'alert' : 'check'} size={18} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Runs an action with busy state and a toast on success or error. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setBusy(true);
      try {
        const r = await fn();
        if (success) toast(success);
        return r;
      } catch (e) {
        toast(`Greška: ${e instanceof Error ? e.message : String(e)}`, true);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { busy, run };
}

/** Loads data on mount (and when deps change). */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    fn()
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, reload: () => setTick((t) => t + 1), setData };
}

/* Data table -------------------------------------------------------------- */
export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sort?: (row: T) => string | number | null;
  num?: boolean;
  width?: number | string;
}
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  selected,
  onSelectedChange,
  empty,
  pageSize = 50,
  initialSort,
  footer,
  label,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selected?: Set<string | number>;
  onSelectedChange?: (next: Set<string | number>) => void;
  empty?: ReactNode;
  pageSize?: number;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  footer?: ReactNode;
  label: string;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [limit, setLimit] = useState(pageSize);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const f = col.sort;
    return [...rows].sort((a, b) => {
      const x = f(a);
      const y = f(b);
      if (x === y) return 0;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'sr');
      return sort.dir === 'asc' ? r : -r;
    });
  }, [rows, sort, columns]);
  useEffect(() => setLimit(pageSize), [rows, pageSize]);
  const visible = sorted.slice(0, limit);
  const allSelected = !!selected && rows.length > 0 && rows.every((r) => selected.has(rowKey(r)));

  const toggleAll = () => {
    if (!onSelectedChange || !selected) return;
    const next = new Set(selected);
    if (allSelected) rows.forEach((r) => next.delete(rowKey(r)));
    else rows.forEach((r) => next.add(rowKey(r)));
    onSelectedChange(next);
  };
  const toggle = (k: string | number) => {
    if (!onSelectedChange || !selected) return;
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelectedChange(next);
  };

  return (
    <div className={s.tableWrap}>
      <table className={s.table} aria-label={label}>
        <thead>
          <tr>
            {selected && (
              <th className={s.checkCell}>
                <input type="checkbox" aria-label="Izaberi sve" checked={allSelected} onChange={toggleAll} />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                className={c.num ? s.num : undefined}
                style={c.width ? { width: c.width } : undefined}
                aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
              >
                {c.sort ? (
                  <button onClick={() => setSort((p) => ({ key: c.key, dir: p?.key === c.key && p.dir === 'asc' ? 'desc' : 'asc' }))}>
                    {c.header}
                    {sort?.key === c.key && <AdminIcon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={12} />}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const k = rowKey(r);
            return (
              <tr
                key={k}
                className={cx(onRowClick && s.clickable, selected?.has(k) && s.selected)}
                onClick={onRowClick ? (e) => {
                  if ((e.target as HTMLElement).closest('input,button,a,select')) return;
                  onRowClick(r);
                } : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && e.target === e.currentTarget && onRowClick(r) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {selected && (
                  <td className={s.checkCell}>
                    <input type="checkbox" aria-label="Izaberi red" checked={selected.has(k)} onChange={() => toggle(k)} />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={c.num ? s.num : undefined}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (empty ?? <Empty title="Nema podataka" />)}
      {(rows.length > limit || footer) && (
        <div className={s.tableFooter}>
          <span>
            Prikazano {Math.min(limit, rows.length)} od {rows.length}
          </span>
          <span className={s.row}>
            {footer}
            {rows.length > limit && (
              <Btn size="sm" onClick={() => setLimit((l) => l + pageSize)}>
                Prikaži još
              </Btn>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
