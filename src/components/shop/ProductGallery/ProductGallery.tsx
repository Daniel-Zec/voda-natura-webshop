import styles from './ProductGallery.module.css';

export interface ProductGalleryProps {
  images: { src: string; alt: string }[];
  /** Product name, used when an image has no alt text */
  name: string;
}

/**
 * Product photos. Works without JavaScript: thumbnails are radio buttons that switch
 * the large image with CSS only. One image = no thumbnails. The first image is loaded
 * eagerly (it is the page's main image), the rest lazily.
 */
export function ProductGallery({ images, name }: ProductGalleryProps) {
  if (!images.length) {
    return <div className={styles.empty}>Fotografija uskoro</div>;
  }
  const group = `gallery-${name.replace(/\W+/g, '').slice(0, 12)}`;
  return (
    <div className={styles.gallery}>
      {images.map((img, i) => (
        <input
          key={`r-${img.src}`}
          type="radio"
          name={group}
          id={`${group}-${i}`}
          defaultChecked={i === 0}
          className={styles.radio}
          aria-label={`Slika ${i + 1}`}
        />
      ))}
      <div className={styles.stage}>
        {images.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt || name}
            className={styles.main}
            width={700}
            height={700}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : undefined}
            decoding="async"
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((img, i) => (
            <label key={`t-${img.src}`} htmlFor={`${group}-${i}`} className={styles.thumb}>
              <img src={img.src} alt="" width={72} height={72} loading="lazy" decoding="async" />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
