/**
 * Cart storage shared by the header script (src/scripts/cart.ts), the cart page and checkout.
 *
 * The cart lives in the visitor's browser (localStorage) as a per-browser convenience; the
 * server re-prices everything when the order is placed. Every change fires `vn-cart-change`
 * so the header counters update without a page reload.
 */

export interface CartLine {
  sku: string;
  name: string;
  /** Price when added (RSD, VAT incl.). The cart page refreshes it from the catalogue. */
  price: number;
  qty: number;
}

/** What the cart and checkout need to know about a product (built from the catalogue at publish time). */
export interface CartProduct {
  sku: string;
  name: string;
  href: string;
  image: { src: string; alt: string };
  price: number;
  stock: 'inStock' | 'outOfStock' | 'madeToOrder';
}

export const CART_KEY = 'vn-cart-v1';
export const CART_EVENT = 'vn-cart-change';
export const MAX_QTY = 99;

export function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const list = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(list) ? list.filter((l) => l && typeof l.sku === 'string' && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* private mode or storage blocked: the page still works, the cart just isn't remembered */
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

export const clearCart = () => writeCart([]);

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.qty, 0);

/**
 * Cart lines joined with the current catalogue: current price and stock, and whether the product
 * is still sold. Lines whose stored price differs get `priceChanged`.
 */
export interface ResolvedLine extends CartLine {
  product: CartProduct | null;
  priceChanged: boolean;
}

export function resolveCart(lines: CartLine[], catalog: Record<string, CartProduct>): ResolvedLine[] {
  return lines.map((l) => {
    const product = catalog[l.sku] ?? null;
    const price = product ? product.price : l.price;
    return { ...l, name: product?.name ?? l.name, price, product, priceChanged: !!product && product.price !== l.price };
  });
}

/** True when a line can't be ordered: no longer sold or out of stock. */
export const isBlocked = (l: ResolvedLine) => !l.product || l.product.stock === 'outOfStock';
