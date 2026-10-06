import styles from './SiteFooter.module.css';
import { Icon } from '../../ui/Icon/Icon';

interface SocialLink {
  network: 'instagram' | 'facebook';
  label: string;
  /** Profile URL. Empty = shown dimmed, not clickable, until the link exists. */
  href: string;
}

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
  contact: { phone: string; phoneHref?: string; email: string; hours: string; /** Street and city, one line each */ address?: string[] };
  legal: Link[];
  /** Social profile icons under the brand text */
  social?: SocialLink[];
  year?: number;
}

/** Dark footer: brand and partner note, social icons, link groups, contact, legal links. */
export function SiteFooter({ logoSrc, about, groups, contact, legal, social = [], year = new Date().getFullYear() }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <img src={logoSrc} alt="VodaNatura" width={200} height={38} loading="lazy" />
            <p className={styles.about}>{about}</p>
            {social.length > 0 && (
              <ul role="list" className={styles.social} aria-label="Društvene mreže">
                {social.map((s) => (
                  <li key={s.network}>
                    {s.href ? (
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                        <Icon name={s.network} size={20} label={`VodaNatura na mreži ${s.label}`} />
                      </a>
                    ) : (
                      <span className={`${styles.socialLink} ${styles.socialPending}`} title={`${s.label} – uskoro`}>
                        <Icon name={s.network} size={20} label={`${s.label} – uskoro`} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
              {contact.address && (
                <li>
                  <address className={styles.address}>
                    {contact.address.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </address>
                </li>
              )}
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
