import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { AdminIcon } from '../components/AdminIcon';
import { ProductTabs, imgSrc } from '../components/ProductBits';
import { Empty, Loading, PageHeader, SearchInput, Select, ui } from '../components/ui';
import { categoryPath } from '../lib/labels';
import s from './screens.module.css';

export function Gallery() {
  const { catalog, openProduct } = useAdmin();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [only, setOnly] = useState('');

  const rows = useMemo(() => {
    if (!catalog) return [];
    const n = q.trim().toLowerCase();
    return catalog.products.filter((p) => {
      if (n && !p.name.toLowerCase().includes(n) && !p.sku.toLowerCase().includes(n)) return false;
      if (cat && p.category_id !== Number(cat) && catalog.categories.find((c) => c.id === p.category_id)?.parent_id !== Number(cat)) return false;
      if (only === 'none' && p.images.length) return false;
      if (only === 'one' && p.images.length !== 1) return false;
      if (only === 'few' && p.images.length >= 3) return false;
      return true;
    });
  }, [catalog, q, cat, only]);

  if (!catalog) return <Loading />;
  const none = catalog.products.filter((p) => !p.images.length).length;
  const one = catalog.products.filter((p) => p.images.length === 1).length;

  return (
    <>
      <PageHeader title="Proizvodi" subtitle={`${none} bez slike · ${one} sa samo jednom slikom. Kliknite na proizvod da dodate ili promenite slike.`} />
      <ProductTabs active="gallery" />
      <div className={ui.toolbar}>
        <SearchInput value={q} onChange={setQ} placeholder="Naziv ili šifra" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Kategorija">
          <option value="">Sve kategorije</option>
          {catalog.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryPath(catalog.categories, c.id)}
            </option>
          ))}
        </Select>
        <Select value={only} onChange={(e) => setOnly(e.target.value)} aria-label="Broj slika">
          <option value="">Svi proizvodi</option>
          <option value="none">Bez slike</option>
          <option value="one">Samo jedna slika</option>
          <option value="few">Manje od 3 slike</option>
        </Select>
      </div>
      {rows.length ? (
        <div className={s.galleryGrid}>
          {rows.map((p) => {
            const img = p.images.find((i) => i.is_primary) ?? p.images[0];
            return (
              <button key={p.id} className={s.galleryItem} onClick={() => openProduct(p.id)}>
                {img ? <img src={imgSrc(img.src)} alt={img.alt} loading="lazy" /> : <span className={s.galleryEmpty}><AdminIcon name="image" size={28} /></span>}
                <span className={s.galleryName}>{p.name}</span>
                <span className={s.galleryMeta}>
                  <span>{p.sku}</span>
                  <span className={p.images.length === 0 ? ui.errorText : p.images.length === 1 ? ui.warnText : undefined}>
                    {p.images.length} {p.images.length === 1 ? 'slika' : 'slike'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <Empty icon="image" title="Nijedan proizvod ne odgovara filterima" />
      )}
    </>
  );
}
