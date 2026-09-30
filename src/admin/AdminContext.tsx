import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminApi } from './lib/api';
import type { Catalog } from './lib/types';

interface Ctx {
  api: AdminApi;
  catalog: Catalog | null;
  catalogError: string | null;
  reloadCatalog: () => Promise<void>;
  /** Opens the one product pop-up from anywhere (table, gallery, order detail). */
  openProduct: (id: number) => void;
  openProductId: number | null;
  closeProduct: () => void;
  /** Set after any change that the static shop only shows after a rebuild. */
  unpublished: boolean;
  markChanged: () => void;
  markPublished: () => void;
  email: string;
}

const AdminCtx = createContext<Ctx | null>(null);

export function useAdmin(): Ctx {
  const c = useContext(AdminCtx);
  if (!c) throw new Error('useAdmin outside provider');
  return c;
}

const KEY = 'vn-admin-unpublished';

export function AdminProvider({ api, email, children }: { api: AdminApi; email: string; children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [openProductId, setOpenProductId] = useState<number | null>(null);
  const [unpublished, setUnpublished] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  const reloadCatalog = useCallback(async () => {
    try {
      setCatalog(await api.loadCatalog());
      setCatalogError(null);
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    reloadCatalog();
  }, [reloadCatalog]);

  const persist = (v: boolean) => {
    setUnpublished(v);
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* private mode */
    }
  };

  return (
    <AdminCtx.Provider
      value={{
        api,
        catalog,
        catalogError,
        reloadCatalog,
        openProduct: setOpenProductId,
        openProductId,
        closeProduct: () => setOpenProductId(null),
        unpublished,
        markChanged: () => persist(true),
        markPublished: () => persist(false),
        email,
      }}
    >
      {children}
    </AdminCtx.Provider>
  );
}
