import { useEffect, useState } from 'react';
import { Icon, iconNames } from '../../components/ui/Icon/Icon';
import { radii, scales, semanticColors, spacing, textStyles } from './tokens';

function useCssVar(name: string) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim()), [name]);
  return value;
}

function luminance(hex: string) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return 1;
  const [r, g, b] = m.map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (hex: string) => (1.05 / (luminance(hex) + 0.05)).toFixed(1);

function Swatch({ cssVar, title, note }: { cssVar: string; title: string; note?: string }) {
  const value = useCssVar(cssVar);
  const ratio = value.startsWith('#') ? Number(contrast(value)) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ height: 56, borderRadius: 10, background: `var(${cssVar})`, border: '1px solid var(--vn-color-border-default)' }} />
      <code style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-all' }}>{title}</code>
      <span style={{ fontSize: 12, color: 'var(--vn-color-text-secondary)' }}>
        {value.toUpperCase()} {ratio ? `· ${ratio}:1${ratio >= 4.5 ? ' AA' : ratio >= 3 ? ' AA large' : ''}` : ''}
      </span>
      {note && <span style={{ fontSize: 12, color: 'var(--vn-color-text-muted)' }}>{note}</span>}
    </div>
  );
}

const grid = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 16, marginBottom: 32 });

export function SemanticColors() {
  return (
    <div>
      {semanticColors.map((g) => (
        <section key={g.group}>
          <h3 style={{ fontSize: 16, margin: '24px 0 12px' }}>{g.group}</h3>
          <div style={grid(170)}>
            {g.tokens.map((t) => (
              <Swatch key={t.name} cssVar={`--vn-color-${t.name}`} title={`--vn-color-${t.name}`} note={t.use} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ColorScales() {
  return (
    <div>
      {scales.map((s) => (
        <section key={s.name}>
          <h3 style={{ fontSize: 16, margin: '24px 0 12px' }}>{s.label}</h3>
          <div style={grid(96)}>
            {s.steps.map((step) => (
              <Swatch key={step} cssVar={`--vn-${s.name}-${step}`} title={`${s.name}-${step}`} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TypeScale() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {textStyles.map((t) => (
        <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, padding: '16px 0', borderTop: '1px solid var(--vn-color-border-subtle)', alignItems: 'baseline' }}>
          <div>
            <code style={{ fontSize: 13, fontWeight: 600 }}>.vn-{t.name}</code>
            <div style={{ fontSize: 12, color: 'var(--vn-color-text-secondary)' }}>{t.label} · {t.use}</div>
          </div>
          <div className={`vn-${t.name}`}>{t.sample}</div>
        </div>
      ))}
    </div>
  );
}

export function SpacingScale() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {spacing.map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <code style={{ width: 140, fontSize: 13 }}>--vn-space-{s}</code>
          <div style={{ height: 16, width: `var(--vn-space-${s})`, background: 'var(--vn-color-accent-water)', borderRadius: 3 }} />
          <span style={{ fontSize: 12, color: 'var(--vn-color-text-secondary)' }}>{s * 4} px</span>
        </div>
      ))}
    </div>
  );
}

export function RadiusScale() {
  return (
    <div style={grid(120)}>
      {radii.map((r) => (
        <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 72, background: 'var(--vn-color-bg-warm)', border: '1px solid var(--vn-color-border-warm)', borderRadius: `var(--vn-radius-${r})` }} />
          <code style={{ fontSize: 12 }}>--vn-radius-{r}</code>
        </div>
      ))}
    </div>
  );
}

export function IconGallery() {
  return (
    <div style={grid(110)}>
      {iconNames.map((name) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, border: '1px solid var(--vn-color-border-subtle)', borderRadius: 12 }}>
          <Icon name={name} size={28} />
          <code style={{ fontSize: 12 }}>{name}</code>
        </div>
      ))}
    </div>
  );
}
