import { Button } from '../../ui/Button/Button';
import { Price } from '../../ui/Price/Price';
import type { CartridgeSummary } from '../../../data/types';
import styles from './CartridgeCard.module.css';

export interface CartridgeCardProps {
  cartridge: CartridgeSummary;
  href: string;
}

/** Small tile for repeat cartridge orders: photo, code, what it's for, price and a quick "+" add button. */
export function CartridgeCard({ cartridge, href }: CartridgeCardProps) {
  return (
    <article className={styles.card}>
      <a href={href} className={styles.media} tabIndex={-1} aria-hidden="true">
        <img src={cartridge.image.src} alt="" loading="lazy" decoding="async" width={240} height={240} />
      </a>
      <div>
        <h3 className={styles.name}>
          <a href={href}>{cartridge.name}</a>
        </h3>
        <p className={styles.description}>{cartridge.description}</p>
      </div>
      <div className={styles.row}>
        <Price amount={cartridge.price} size="sm" />
        <Button
          variant="primary"
          icon="plus"
          iconOnly
          aria-label={`Dodaj ${cartridge.name} u korpu`}
          data-add-to-cart={cartridge.sku}
          data-name={cartridge.name}
          data-price={cartridge.price}
        />
      </div>
    </article>
  );
}
