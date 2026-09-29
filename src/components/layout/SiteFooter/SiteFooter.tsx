import styles from './SiteFooter.module.css';

interface Link {
  label: string;
  href: string;
}
interface LinkGroup {
  title: string;
  links: Link[];
}

export interface SiteFooterProps {
  logoSrc: string;
  about: string;
  groups: LinkGroup[];
  contact: { phone: string; phoneHref?: string; email: string; hours: string };
  legal: Link[];
  year?: number;
}

/** Dark footer: brand and partner note, link groups, contact, legal links. */
export function SiteFooter({ logoSrc, about, groups, contact, legal, year = new Date().getFullYear() }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <img src={logoSrc} alt="VodaNatura" width={200} height={38} loading="lazy" />
            <p className={styles.about}>{about}</p>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              <ul role="list">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className={styles.group}>
            <p className={styles.groupTitle}>Kontakt</p>
            <ul role="list">
              <li>{contact.phoneHref ? <a href={contact.phoneHref}>{contact.phone}</a> : contact.phone}</li>
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li className={styles.muted}>{contact.hours}</li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>© {year} VodaNatura</p>
          <ul role="list" className={styles.legal}>
            {legal.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
