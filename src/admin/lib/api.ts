/**
 * Everything the admin screens read or write. Two implementations:
 *  - supabaseApi (real data, src/admin/lib/supabaseApi.ts)
 *  - demoApi (sample data for screenshots and tests, src/admin/lib/demoApi.ts; only in builds
 *    with PUBLIC_ADMIN_DEMO=true, never on the live site)
 */
import type {
  AuthStep,
  Banner,
  Catalog,
  CommissionLine,
  CommissionRule,
  Customer,
  EmailLogRow,
  EmailTemplate,
  Order,
  OrderStatus,
  PriceHistoryRow,
  PriceMode,
  ProductDocument,
  ProductImage,
  ProductInternal,
  ProductPatch,
  RepublishResult,
  Settings,
  StatusHistoryRow,
  StockImportRow,
  StockImportSummary,
} from './types';

export interface AdminApi {
  demo: boolean;
  auth: {
    current(): Promise<AuthStep>;
    signIn(email: string, password: string): Promise<AuthStep>;
    signOut(): Promise<void>;
    resetPassword(email: string): Promise<void>;
    /** After the reset-password link: set the new password. */
    updatePassword(password: string): Promise<void>;
    enrollTotp(): Promise<{ factorId: string; qrSvg: string; secret: string }>;
    verifyTotp(factorId: string, code: string): Promise<AuthStep>;
    onSignedOut(cb: () => void): () => void;
  };

  loadCatalog(): Promise<Catalog>;
  updateProduct(id: number, patch: ProductPatch): Promise<void>;
  updateProductInternal(id: number, patch: Partial<ProductInternal>): Promise<void>;
  setPrices(ids: number[], mode: PriceMode, value: number | null, source: 'override' | 'bulk' | 'manual'): Promise<number>;
  priceHistory(productId: number): Promise<PriceHistoryRow[]>;
  setVisibility(ids: number[], visible: boolean): Promise<void>;
  setCategory(ids: number[], categoryId: number): Promise<void>;

  uploadFile(folder: 'products' | 'documents' | 'banners', file: File): Promise<string>;
  addImage(productId: number, src: string, alt: string): Promise<ProductImage>;
  updateImage(id: number, patch: Partial<Pick<ProductImage, 'alt' | 'sort_order' | 'is_primary'>>): Promise<void>;
  deleteImage(id: number): Promise<void>;
  setPrimaryImage(productId: number, imageId: number): Promise<void>;
  reorderImages(productId: number, orderedIds: number[]): Promise<void>;
  listDocuments(productId: number): Promise<ProductDocument[]>;
  addDocument(productId: number, title: string, url: string): Promise<void>;
  deleteDocument(id: number): Promise<void>;

  /** pct = null removes the rule (falls back to the category / default rate). */
  setCommissionRule(target: { category_id: number } | { product_id: number }, pct: number | null): Promise<void>;
  setCommissionRules(targets: ({ category_id: number } | { product_id: number })[], pct: number | null): Promise<void>;
  listCommissionRules(): Promise<CommissionRule[]>;
  listCommissionLines(): Promise<CommissionLine[]>;

  listOrders(): Promise<Order[]>;
  orderActivity(orderId: number): Promise<{ history: StatusHistoryRow[]; emails: EmailLogRow[] }>;
  setOrderStatus(orderId: number, status: OrderStatus, note: string): Promise<void>;
  updateOrder(orderId: number, patch: Partial<Pick<Order, 'tracking_code' | 'internal_note'>>): Promise<void>;
  lastStatusChanges(): Promise<{ order_id: number; changed_at: string }[]>;

  listCustomers(): Promise<Customer[]>;
  anonymizeCustomer(email: string): Promise<number>;

  listStockImports(): Promise<StockImportRow[]>;
  applyStockImport(input: {
    fileName: string;
    changes: { product_id: number; qty: number }[];
    summary: StockImportSummary;
    status: 'success' | 'warnings' | 'failed';
    rowsRead: number;
    rowsMatched: number;
    rowsFailed: number;
  }): Promise<number>;
  undoStockImport(id: number): Promise<void>;

  saveSettings(values: Settings): Promise<void>;

  listTemplates(): Promise<EmailTemplate[]>;
  saveTemplate(key: string, patch: Partial<Pick<EmailTemplate, 'subject' | 'body' | 'is_active'>>): Promise<void>;
  listEmailLog(): Promise<EmailLogRow[]>;

  listBanners(): Promise<Banner[]>;
  saveBanner(banner: Omit<Banner, 'id'> & { id?: number }): Promise<void>;
  deleteBanner(id: number): Promise<void>;

  republish(): Promise<RepublishResult>;
}

let current: AdminApi | null = null;

/** Picks the data source once. Demo data only exists in builds made with PUBLIC_ADMIN_DEMO=true. */
export async function getApi(): Promise<AdminApi> {
  if (current) return current;
  if (import.meta.env.PUBLIC_ADMIN_DEMO === 'true') {
    const { demoApi } = await import('./demoApi');
    current = demoApi;
  } else {
    const { supabaseApi } = await import('./supabaseApi');
    current = supabaseApi;
  }
  return current;
}
