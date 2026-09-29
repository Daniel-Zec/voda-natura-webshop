import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Icon } from '../../ui/Icon/Icon';
import { Price } from '../../ui/Price/Price';
import { StockStatus, type StockState } from '../../ui/StockStatus/StockStatus';
import styles from './BuyBox.module.css';

export interface BuyBoxProps {
  sku: string;
  name: string;
  price: number;
  stock: StockState;
  /** e.g. "Isporuka za oko 4 radna dana" */
  deliveryNote: string;
  /** "Troškove dostave plaćate kuriru prilikom preuzimanja." */
  shippingNote: string;
  maintenance?: string;
  warrantyYears?: number;
}

/**
 * Price and buy actions on the product page. "Plaćanje pouzećem" sits next to the price
 * (SEO guide: cash on delivery is the strongest trust signal). Buttons use the same
 * data attributes as the cards, so the cart script handles them without React.
 */
export function BuyBox({ sku, name, price, stock, deliveryNote, shippingNote, maintenance, warrantyYears = 2 }: BuyBoxProps) {
  const disabled = stock === 'outOfStock';
  return (
    <div className={styles.box}>
      <div className={styles.priceRow}>
        <Price amount={price} size="lg" brand />
        <Badge tone="success">Plaćanje pouzećem</Badge>
      </div>
      <p className={styles.vat}>Cena sa PDV-om</p>
      <StockStatus state={stock} />
      {stock === 'madeToOrder' && (
        <p className={styles.notice}>Ovaj uređaj se poručuje iz uvoza. Čeka se do 3–4 meseca; javljamo vam se pre slanja.</p>
      )}
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          icon="cart"
          className={styles.cart}
          data-add-to-cart={sku}
          data-name={name}
          data-price={price}
          disabled={disabled}
        >
          {disabled ? 'Nema na stanju' : 'Dodaj u korpu'}
        </Button>
        <label className={styles.compare}>
          <input type="checkbox" data-compare={sku} data-name={name} />
          Uporedi
        </label>
      </div>
      <ul role="list" className={styles.facts}>
        <li>
          <Icon name="truck" size={20} />
          <span>{deliveryNote}. {shippingNote}</span>
        </li>
        <li>
          <Icon name="cash" size={20} />
          <span>Plaćate gotovinom kuriru, tek kada paket stigne.</span>
        </li>
        <li>
          <Icon name="shield" size={20} />
          <span>Garancija {warrantyYears} godine na uređaje i kućišta, uz stručnu ugradnju.</span>
        </li>
        {maintenance && (
          <li>
            <Icon name="drop" size={20} />
            <span>Održavanje: {maintenance}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
