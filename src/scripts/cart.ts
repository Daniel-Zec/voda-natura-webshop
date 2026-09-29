/**
 * Minimal cart + compare store for the static shop pages.
 *
 * Any element with `data-add-to-cart="<sku>" data-name data-price` adds one unit;
 * any checkbox with `data-compare="<sku>"` toggles compare (max 3). Header counters
 * use `data-cart-total`, `data-cart-count` and `data-compare-count`.
 *
 * Stored in localStorage only as a per-browser convenience; the order itself is
 * saved in Supabase at checkout (next milestone).
 */

export interface CartLine {
  sku: string;
  name: string;
  price: number;
  qty: number;
}

const CART_KEY = 'vn-cart-v1';
const COMPARE_KEY = 'vn-compare-v1';
const COMPARE_MAX = 3;

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
    /* private mode or storage blocked: the page still works, the cart just isn't remembered */
  }
}

export const getCart = () => read<CartLine[]>(CART_KEY, []);
export const getCompare = () => read<{ sku: string; name: string }[]>(COMPARE_KEY, []);

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
  const cart = getCart();
  const line = cart.find((l) => l.sku === sku);
  if (line) line.qty += 1;
  else cart.push({ sku, name, price, qty: 1 });
  write(CART_KEY, cart);
  render();
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
render();
