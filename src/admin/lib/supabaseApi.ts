import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../config/supabase';
import { slugify } from '../../lib/format';
import type { AdminApi } from './api';
import type { AuthStep, Catalog, Product, ProductInternal, Settings } from './types';

const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'vn-admin-auth' },
});

/** Throws a readable error for any Supabase response with an error. */
function check<T>(res: { data: T; error: unknown }): NonNullable<T> {
  if (res.error) throw new Error((res.error as { message?: string }).message ?? String(res.error));
  return res.data as NonNullable<T>;
}

async function authState(): Promise<AuthStep> {
  const { data } = await sb.auth.getSession();
  const session = data.session;
  if (!session) return { step: 'signed_out' };
  const status = check(await sb.rpc('admin_status')) as { listed: boolean; aal: string };
  if (!status.listed) return { step: 'not_admin', email: session.user.email ?? '' };
  const aal = check(await sb.auth.mfa.getAuthenticatorAssuranceLevel());
  if (aal.currentLevel === 'aal2') return { step: 'ready', email: session.user.email ?? '' };
  const factors = check(await sb.auth.mfa.listFactors());
  const totp = factors.totp.find((f) => f.status === 'verified');
  return totp ? { step: 'challenge', factorId: totp.id } : { step: 'enroll' };
}

const internalEmpty: ProductInternal = { partner_name: null, partner_description_html: null, data_notes: null, stock_codes: [] };

export const supabaseApi: AdminApi = {
  demo: false,

  auth: {
    current: authState,
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return authState();
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async resetPassword(email) {
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      check(await sb.auth.resetPasswordForEmail(email, { redirectTo }));
    },
    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    async enrollTotp() {
      // Remove half-finished enrolments first (Supabase refuses a second one with the same name).
      const factors = check(await sb.auth.mfa.listFactors());
      for (const f of factors.all.filter((f) => f.factor_type === 'totp' && f.status !== 'verified')) {
        await sb.auth.mfa.unenroll({ factorId: f.id });
      }
      const data = check(await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `VodaNatura admin ${Date.now()}` }));
      return { factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret };
    },
    async verifyTotp(factorId, code) {
      check(await sb.auth.mfa.challengeAndVerify({ factorId, code }));
      return authState();
    },
    onSignedOut(cb) {
      const { data } = sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') cb();
      });
      return () => data.subscription.unsubscribe();
    },
  },

  async loadCatalog(): Promise<Catalog> {
    const [categories, products, rules, settings] = await Promise.all([
      sb.from('categories').select('id,slug,name,parent_id,sort_order,is_visible').order('sort_order'),
      sb
        .from('products')
        .select('*, images:product_images(*), internal:product_internal(partner_name,partner_description_html,data_notes,stock_codes)')
        .order('name'),
      sb.from('commission_rules').select('id,category_id,product_id,pct'),
      sb.from('settings').select('key,value'),
    ]);
    const prods = (check(products) as (Product & { internal: ProductInternal | ProductInternal[] | null })[]).map((p) => ({
      ...p,
      specs: Array.isArray(p.specs) ? p.specs : [],
      images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      internal: (Array.isArray(p.internal) ? p.internal[0] : p.internal) ?? internalEmpty,
    }));
    return {
      categories: check(categories),
      products: prods,
      rules: check(rules).map((r) => ({ ...r, pct: Number(r.pct) })),
      settings: Object.fromEntries(check(settings).map((s: { key: string; value: unknown }) => [s.key, s.value])),
    };
  },

  async updateProduct(id, patch) {
    check(await sb.from('products').update(patch).eq('id', id));
  },
  async updateProductInternal(id, patch) {
    check(await sb.from('product_internal').upsert({ product_id: id, ...patch }));
  },
  async setPrices(ids, mode, value, source) {
    return check(await sb.rpc('admin_set_prices', { p_ids: ids, p_mode: mode, p_value: value, p_source: source })) as number;
  },
  async priceHistory(productId) {
    return check(await sb.from('price_history').select('*').eq('product_id', productId).order('changed_at', { ascending: false }).limit(50));
  },
  async setVisibility(ids, visible) {
    check(await sb.from('products').update({ is_visible: visible }).in('id', ids));
  },
  async setCategory(ids, categoryId) {
    check(await sb.from('products').update({ category_id: categoryId }).in('id', ids));
  },

  async uploadFile(folder, file) {
    const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase();
    const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'fajl';
    const path = `${folder}/${Date.now()}-${base}.${ext}`;
    check(await sb.storage.from('media').upload(path, file, { contentType: file.type, upsert: false }));
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  },
  async addImage(productId, src, alt) {
    const { count } = await sb.from('product_images').select('id', { count: 'exact', head: true }).eq('product_id', productId);
    return check(
      await sb
        .from('product_images')
        .insert({ product_id: productId, src, alt, sort_order: count ?? 0, is_primary: !count })
        .select()
        .single(),
    );
  },
  async updateImage(id, patch) {
    check(await sb.from('product_images').update(patch).eq('id', id));
  },
  async deleteImage(id) {
    check(await sb.from('product_images').delete().eq('id', id));
  },
  async setPrimaryImage(productId, imageId) {
    check(await sb.from('product_images').update({ is_primary: false }).eq('product_id', productId));
    check(await sb.from('product_images').update({ is_primary: true }).eq('id', imageId));
  },
  async reorderImages(_productId, orderedIds) {
    await Promise.all(orderedIds.map((id, i) => sb.from('product_images').update({ sort_order: i }).eq('id', id).then(check)));
  },
  async listDocuments(productId) {
    return check(await sb.from('product_documents').select('*').eq('product_id', productId).order('sort_order'));
  },
  async addDocument(productId, title, url) {
    check(await sb.from('product_documents').insert({ product_id: productId, title, url }));
  },
  async deleteDocument(id) {
    check(await sb.from('product_documents').delete().eq('id', id));
  },

  async setCommissionRule(target, pct) {
    await supabaseApi.setCommissionRules([target], pct);
  },
  async setCommissionRules(targets, pct) {
    const cats = targets.filter((t): t is { category_id: number } => 'category_id' in t).map((t) => t.category_id);
    const prods = targets.filter((t): t is { product_id: number } => 'product_id' in t).map((t) => t.product_id);
    if (cats.length) check(await sb.from('commission_rules').delete().in('category_id', cats));
    if (prods.length) check(await sb.from('commission_rules').delete().in('product_id', prods));
    if (pct === null) return;
    const rows = [...cats.map((category_id) => ({ category_id, pct })), ...prods.map((product_id) => ({ product_id, pct }))];
    if (rows.length) check(await sb.from('commission_rules').insert(rows));
  },
  async listCommissionRules() {
    return check(await sb.from('commission_rules').select('id,category_id,product_id,pct')).map((r) => ({ ...r, pct: Number(r.pct) }));
  },
  async listCommissionLines() {
    const rows = check(await sb.from('commission_lines').select('*').order('ordered_at', { ascending: false }));
    return rows.map((r) => ({ ...r, commission_pct: Number(r.commission_pct), commission_amount: Number(r.commission_amount) }));
  },

  async listOrders() {
    const rows = check(await sb.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }));
    return rows.map((o) => ({
      ...o,
      commission_total: Number(o.commission_total),
      items: (o.items ?? []).map((i: { commission_pct: unknown; commission_amount: unknown }) => ({
        ...i,
        commission_pct: Number(i.commission_pct),
        commission_amount: Number(i.commission_amount),
      })),
    }));
  },
  async orderActivity(orderId) {
    const [history, emails] = await Promise.all([
      sb.from('order_status_history').select('*').eq('order_id', orderId).order('changed_at'),
      sb.from('email_log').select('*').eq('order_id', orderId).order('created_at'),
    ]);
    return { history: check(history), emails: check(emails) };
  },
  async setOrderStatus(orderId, status, note) {
    check(await sb.rpc('admin_set_order_status', { p_order_id: orderId, p_status: status, p_note: note }));
  },
  async updateOrder(orderId, patch) {
    check(await sb.from('orders').update(patch).eq('id', orderId));
  },
  async lastStatusChanges() {
    return check(await sb.from('order_status_history').select('order_id,changed_at').order('changed_at', { ascending: false }).limit(1000));
  },

  async listCustomers() {
    return check(await sb.from('admin_customers').select('*').order('last_order_at', { ascending: false }));
  },
  async anonymizeCustomer(email) {
    return check(await sb.rpc('admin_anonymize_customer', { p_email: email })) as number;
  },

  async listStockImports() {
    return check(await sb.from('stock_imports').select('id,file_name,status,rows_read,rows_matched,rows_failed,summary,created_at,undone_at').order('created_at', { ascending: false }).limit(50));
  },
  async applyStockImport(i) {
    return check(
      await sb.rpc('admin_apply_stock_import', {
        p_file_name: i.fileName,
        p_changes: i.changes,
        p_summary: i.summary,
        p_status: i.status,
        p_rows_read: i.rowsRead,
        p_rows_matched: i.rowsMatched,
        p_rows_failed: i.rowsFailed,
      }),
    ) as number;
  },
  async undoStockImport(id) {
    check(await sb.rpc('admin_undo_stock_import', { p_id: id }));
  },

  async saveSettings(values: Settings) {
    const rows = Object.entries(values).map(([key, value]) => ({ key, value }));
    for (const r of rows) check(await sb.from('settings').update({ value: r.value }).eq('key', r.key));
  },

  async listTemplates() {
    return check(await sb.from('email_templates').select('*').order('key', { ascending: false }));
  },
  async saveTemplate(key, patch) {
    check(await sb.from('email_templates').update(patch).eq('key', key));
  },
  async listEmailLog() {
    return check(await sb.from('email_log').select('*').order('created_at', { ascending: false }).limit(500));
  },

  async listMessages() {
    return check(await sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(1000));
  },
  async setMessageStatus(ids, status) {
    check(await sb.from('contact_messages').update({ status }).in('id', ids));
  },
  async deleteMessage(id) {
    check(await sb.from('contact_messages').delete().eq('id', id));
  },

  async listBanners() {
    return check(await sb.from('banners').select('*').order('placement').order('sort_order'));
  },
  async saveBanner(banner) {
    const { id, ...rest } = banner;
    if (id) check(await sb.from('banners').update(rest).eq('id', id));
    else check(await sb.from('banners').insert(rest));
  },
  async deleteBanner(id) {
    check(await sb.from('banners').delete().eq('id', id));
  },

  async republish() {
    const { error } = await sb.functions.invoke('republish', { method: 'POST' });
    if (!error) return { ok: true };
    const status = (error as { context?: Response }).context?.status;
    if (status === 501) return { ok: false, reason: 'not_configured' };
    return { ok: false, reason: 'error', detail: error.message };
  },
};
