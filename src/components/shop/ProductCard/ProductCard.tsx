import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Price } from '../../ui/Price/Price';
import { StockStatus } from '../../ui/StockStatus/StockStatus';
import type { ProductSummary } from '../../../data/types';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  product: ProductSummary;
  href: string;
  /**
   * vertical = desktop card · horizontal = compact phone row ·
   * responsive = horizontal below 768 px, vertical above (default)
   */
  layout?: 'vertical' | 'horizontal' | 'responsive';
  /** Show the "Uporedi" checkbox (compare up to 3 products) */
  showCompare?: boolean;
  /** Heading level of the product name inside its section */
  headingLevel?: 2 | 3;
}

/**
 * Product card for systems. Works without React on the page: "Dodaj u korpu" and
 * "Uporedi" are plain elements with data attributes, handled by the small cart script.
 */
export function ProductCard({ product, href, layout = 'responsive', showCompare = true, headingLevel = 3 }: ProductCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const disabled = product.stock === 'outOfStock';
  return (
    <article className={[styles.card, styles[layout]].join(' ')}>
      <a href={href} className={styles.media} tabIndex={-1} aria-hidden="true">
        <img src={product.image.src} alt="" loading="lazy" decoding="async" width={420} height={420} />
        {product.badge && (
          <span className={styles.badge}>
            <Badge tone={product.badge.tone}>{product.badge.label}</Badge>
          </span>
        )}
      </a>
      <div className={styles.body}>
        {product.kicker && <p className={styles.kicker}>{product.kicker}</p>}
        <Heading className={styles.name}>
          <a href={href}>{product.name}</a>
        </Heading>
        <p className={styles.summary}>{product.summary}</p>
        <StockStatus state={product.stock} size="md" />
        <div className={styles.spacer} />
        <div className={styles.priceRow}>
          <Price amount={product.price} size="md" />
          <Button
            variant="primary"
            icon="cart"
            iconOnly
            className={styles.cartIconButton}
            aria-label={`Dodaj ${product.name} u korpu`}
            data-add-to-cart={product.sku}
            data-name={product.name}
            data-price={product.price}
            disabled={disabled}
          />
        </div>
        {product.maintenance && <p className={styles.maintenance}>Održavanje: {product.maintenance}</p>}
        <div className={styles.actions}>
          <Button
            variant="primary"
            className={styles.cartButton}
            data-add-to-cart={product.sku}
            data-name={product.name}
            data-price={product.price}
            disabled={disabled}
          >
            Dodaj u korpu
          </Button>
          {showCompare && (
            <label className={styles.compare}>
              <input type="checkbox" data-compare={product.sku} data-name={product.name} />
              Uporedi
            </label>
          )}
        </div>
      </div>
    </article>
  );
}
