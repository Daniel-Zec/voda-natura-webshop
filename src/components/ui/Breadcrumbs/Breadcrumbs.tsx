import styles from './Breadcrumbs.module.css';

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
}

/**
 * Breadcrumb trail (Početna › Sistemi › Reverzna osmoza › RO 6 WFU), required on every
 * category and product page by the SEO guide. The last item is the current page.
 * Pair it with BreadcrumbList JSON-LD on the page.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Putanja" className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className={styles.item}>
              {item.href && !last ? <a href={item.href}>{item.label}</a> : <span aria-current={last ? 'page' : undefined}>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
