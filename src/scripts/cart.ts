/**
 * Cart + compare store for the static shop pages.
 *
 * Any element with `data-add-to-cart="<sku>" data-name data-price` adds one unit;
 * any checkbox with `data-compare="<sku>"` toggles compare (max 3). Header counters
 * use `data-cart-total`, `data-cart-count` and `data-compare-count`.
 *
 * The cart itself is in src/lib/cartStore.ts (shared with the cart and checkout pages);
 * the order is saved in Supabase at checkout by the `create-order` function.
 */
import { CART_EVENT, MAX_QTY, readCart, writeCart } from '../lib/cartStore';

const COMPARE_KEY = 'vn-compare-v1';
const COMPARE_MAX = 3;
const SOURCE_KEY = 'vn-source';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage blocked: the page still works, the list just isn't remembered */
  }
}

export const getCart = readCart;
export const getCompare = () => read<{ sku: string; name: string }[]>(COMPARE_KEY, []);

/** Where this visit came from (first page of the session), saved with the order: utm_source/medium/campaign or the referring site. */
function rememberSource() {
  try {
    if (sessionStorage.getItem(SOURCE_KEY)) return;
    const q = new URLSearchParams(window.location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => q.get(k)).filter(Boolean).join(' / ');
    let ref = '';
    if (document.referrer) {
      const host = new URL(document.referrer).host;
      if (host !== window.location.host) ref = host;
    }
    sessionStorage.setItem(SOURCE_KEY, utm || ref || 'direct');
  } catch {
    /* storage blocked */
  }
}

function formatRSD(n: number) {
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} RSD`;
}

function render() {
  const cart = getCart();
  const count = cart.reduce((sum, l) => sum + l.qty, 0);
  const total = cart.reduce((sum, l) => sum + l.qty * l.price, 0);
  document.querySelectorAll<HTMLElement>('[data-cart-total]').forEach((el) => (el.textContent = formatRSD(total)));
  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    if (el.hasAttribute('data-hide-zero')) el.hidden = count === 0;
  });
  const compare = getCompare();
  document.querySelectorAll<HTMLElement>('[data-compare-count]').forEach((el) => (el.textContent = String(compare.length)));
  document.querySelectorAll<HTMLInputElement>('input[data-compare]').forEach((input) => {
    input.checked = compare.some((c) => c.sku === input.dataset.compare);
  });
}

let toastTimer: number | undefined;
function toast(message: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), 3200);
}

function addToCart(sku: string, name: string, price: number) {
  const cart = readCart();
  const line = cart.find((l) => l.sku === sku);
  if (line) line.qty = Math.min(MAX_QTY, line.qty + 1);
  else cart.push({ sku, name, price, qty: 1 });
  writeCart(cart);
  toast(`Dodato u korpu: ${name}`);
}

function toggleCompare(input: HTMLInputElement) {
  const sku = input.dataset.compare!;
  let compare = getCompare();
  if (input.checked) {
    if (compare.length >= COMPARE_MAX) {
      input.checked = false;
      toast(`Možete uporediti najviše ${COMPARE_MAX} proizvoda.`);
      return;
    }
    compare.push({ sku, name: input.dataset.name ?? sku });
  } else {
    compare = compare.filter((c) => c.sku !== sku);
  }
  write(COMPARE_KEY, compare);
  render();
}

document.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-add-to-cart]');
  if (!button || button.hasAttribute('disabled')) return;
  event.preventDefault();
  addToCart(button.dataset.addToCart!, button.dataset.name ?? '', Number(button.dataset.price ?? 0));
});

document.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.matches?.('input[data-compare]')) toggleCompare(input);
});

window.addEventListener('storage', render);
window.addEventListener(CART_EVENT, render);
rememberSource();
render();
