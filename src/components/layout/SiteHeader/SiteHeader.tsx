import { Icon } from '../../ui/Icon/Icon';
import { SearchBar } from '../../ui/SearchBar/SearchBar';
import styles from './SiteHeader.module.css';

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteHeaderProps {
  homeHref: string;
  logoSrc: string;
  searchAction: string;
  helpHref: string;
  compareHref: string;
  cartHref: string;
  /** tel: link for the phone icon on phones; empty = links to helpHref */
  phoneHref?: string;
  nav: NavLink[];
  finder: NavLink;
  /** Mark the current section in the menu */
  currentHref?: string;
}

/**
 * Site header: logo, search, help, compare and cart (desktop); menu, logo, phone and cart
 * with search below (phones). The category menu sits under it on desktop and in the
 * phone menu. No JavaScript needed: the phone menu is a <details> element; cart and
 * compare counts are filled in by the cart script via data attributes.
 */
export function SiteHeader({
  homeHref,
  logoSrc,
  searchAction,
  helpHref,
  compareHref,
  cartHref,
  phoneHref,
  nav,
  finder,
  currentHref,
}: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <details className={styles.menu}>
          <summary className={styles.iconButton} aria-label="Meni">
            <Icon name="menu" size={24} className={styles.menuOpen} />
            <Icon name="close" size={24} className={styles.menuClose} />
          </summary>
          <nav aria-label="Kategorije (meni)" className={styles.drawer}>
            <ul role="list">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} aria-current={item.href === currentHref ? 'page' : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={finder.href} className={styles.drawerFinder}>
                  <Icon name="drop" size={18} />
                  {finder.label}
                </a>
              </li>
              <li>
                <a href={helpHref}>Pomoć i česta pitanja</a>
              </li>
            </ul>
          </nav>
        </details>

        <a href={homeHref} className={styles.logo} aria-label="VodaNatura – početna">
          <img src={logoSrc} alt="VodaNatura" width={220} height={41} />
        </a>

        <div className={styles.search}>
          <SearchBar action={searchAction} />
        </div>

        <div className={styles.links}>
          <a href={helpHref} className={styles.textLink}>
            <Icon name="help" size={22} />
            Pomoć
          </a>
          <a href={compareHref} className={styles.textLink}>
            <Icon name="compare" size={22} />
            <span>
              Uporedi (<span data-compare-count>0</span>)
            </span>
          </a>
          <a href={cartHref} className={styles.cartLink}>
            <Icon name="cart" size={22} />
            <span>
              Korpa · <span data-cart-total>0 RSD</span>
            </span>
          </a>
        </div>

        <div className={styles.mobileActions}>
          <a href={phoneHref || helpHref} className={styles.iconButton} aria-label="Pomoć telefonom">
            <Icon name="phone" size={22} />
          </a>
          <a href={cartHref} className={styles.iconButton} aria-label="Korpa">
            <Icon name="cart" size={24} />
            <span className={styles.cartBadge} data-cart-count data-hide-zero hidden>
              0
            </span>
          </a>
        </div>
      </div>

      <div className={styles.mobileSearch}>
        <SearchBar action={searchAction} placeholder="Proizvod ili šifra, npr. BL 10" />
      </div>

      <nav aria-label="Kategorije" className={styles.nav}>
        <ul role="list" className={styles.navList}>
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} aria-current={item.href === currentHref ? 'page' : undefined}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a href={finder.href} className={styles.finder}>
          <Icon name="drop" size={18} />
          {finder.label}
        </a>
      </nav>
    </header>
  );
}
