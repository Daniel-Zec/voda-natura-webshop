/** Admin data shapes. Field names follow the Supabase tables (see supabase/migrations). */

export type StockState = 'in_stock' | 'out_of_stock' | 'made_to_order';
export type PriceMode = 'auto' | 'fixed' | 'percent';
export type ContentStatus = 'partner_copy' | 'rewritten' | 'approved';
export type OrderStatus =
  | 'new'
  | 'sent_to_partner'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'refused'
  | 'returned'
  | 'cancelled';

export interface Category {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  sort_order: number;
  is_visible: boolean;
}

export interface ProductImage {
  id: number;
  product_id: number;
  src: string;
  alt: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductDocument {
  id: number;
  product_id: number;
  title: string;
  url: string;
  sort_order: number;
}

export interface ProductInternal {
  partner_name: string | null;
  partner_description_html: string | null;
  data_notes: string | null;
  stock_codes: string[];
}

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  sku: string;
  slug: string;
  name: string;
  category_id: number | null;
  kicker: string | null;
  summary: string | null;
  description_html: string | null;
  specs: Spec[];
  maintenance: string | null;
  badge_label: string | null;
  badge_tone: string | null;
  partner_price: number;
  price_mode: PriceMode;
  price_override: number | null;
  sale_price: number;
  stock_state: StockState;
  stock_qty: number | null;
  stock_updated_at: string | null;
  made_to_order: boolean;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
  content_status: ContentStatus;
  partner_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  primary_keyword: string | null;
  weight_kg: number | null;
  dimensions_cm: { length?: number; width?: number; height?: number } | null;
  updated_at: string;
  images: ProductImage[];
  internal: ProductInternal;
}

/** Fields the product pop-up may save on `products`. */
export type ProductPatch = Partial<
  Omit<Product, 'id' | 'sale_price' | 'images' | 'internal' | 'updated_at' | 'partner_price' | 'price_mode' | 'price_override'>
>;

export interface CommissionRule {
  id: number;
  category_id: number | null;
  product_id: number | null;
  pct: number;
}

export interface PriceHistoryRow {
  id: number;
  product_id: number;
  old_price: number | null;
  new_price: number;
  source: 'sync' | 'override' | 'bulk' | 'import' | 'manual';
  changed_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  sku: string;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  commission_pct: number;
  commission_amount: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  first_name: string;
  last_name: string;
  street: string;
  house_number: string;
  apartment: string | null;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  customer_note: string | null;
  internal_note: string | null;
  items_total: number;
  commission_total: number;
  tracking_code: string | null;
  source: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface StatusHistoryRow {
  id: number;
  order_id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  changed_at: string;
}

export interface EmailLogRow {
  id: number;
  order_id: number | null;
  template: string;
  recipient: string;
  subject: string;
  status: 'queued' | 'sent' | 'failed';
  error: string | null;
  created_at: string;
}

export interface CommissionLine {
  order_item_id: number;
  order_id: number;
  order_number: string;
  ordered_at: string;
  delivered_at: string | null;
  order_status: OrderStatus;
  sku: string;
  name: string;
  quantity: number;
  line_total: number;
  commission_pct: number;
  commission_amount: number;
  commission_status: 'pending' | 'earned' | 'cancelled';
}

export interface Customer {
  email: string;
  name: string;
  phone: string;
  city: string;
  orders_count: number;
  total_ordered: number;
  last_order_at: string;
  first_order_at: string;
}

export interface StockImportRow {
  id: number;
  file_name: string;
  status: 'success' | 'warnings' | 'failed' | 'undone';
  rows_read: number;
  rows_matched: number;
  rows_failed: number;
  summary: StockImportSummary;
  created_at: string;
  undone_at: string | null;
}

export interface StockImportSummary {
  changed?: number;
  toOut?: number;
  backIn?: number;
  notInFile?: string[];
  failed?: { code: string; reason: string }[];
}

export interface EmailTemplate {
  key: string;
  name: string;
  recipient: 'partner' | 'customer';
  subject: string;
  body: string;
  is_active: boolean;
  updated_at: string;
}

export interface Banner {
  id: number;
  placement: 'hero' | 'promo' | 'announcement';
  title: string;
  body: string | null;
  button_label: string | null;
  button_url: string | null;
  image_desktop: string | null;
  image_mobile: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_draft: boolean;
  sort_order: number;
}

export type Settings = Record<string, unknown>;

export interface Catalog {
  categories: Category[];
  products: Product[];
  rules: CommissionRule[];
  settings: Settings;
}

export type AuthStep =
  | { step: 'signed_out' }
  | { step: 'not_admin'; email: string }
  | { step: 'enroll' }
  | { step: 'challenge'; factorId: string }
  | { step: 'ready'; email: string };

export type RepublishResult = { ok: true } | { ok: false; reason: 'not_configured' | 'error'; detail?: string };
