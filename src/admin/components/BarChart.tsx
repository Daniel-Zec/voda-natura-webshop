import { useState } from 'react';
import s from './BarChart.module.css';

export interface Bar {
  label: string; // x label, e.g. "12.09."
  value: number;
  tooltip: string;
}

/**
 * One series, so no legend: the card title names it. Bars have 4 px rounded tops on the
 * baseline, 2 px gaps, a recessive grid and a hover tooltip; the hit area is the full column.
 * A table view is available for screen readers.
 */
export function BarChart({ bars, height = 180, valueFormat = (v: number) => String(v), label, integer }: { bars: Bar[]; height?: number; valueFormat?: (v: number) => string; label: string; integer?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const ticks = niceTicks(max, integer);
  const top = ticks[ticks.length - 1];
  const W = Math.max(bars.length * 18, 300);
  const H = height;
  const padL = 36;
  const padB = 22;
  const plotW = W - padL;
  const plotH = H - padB - 8;
  const bw = plotW / Math.max(1, bars.length);
  const labelEvery = Math.ceil(bars.length / 10);

  return (
    <div className={s.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={label} preserveAspectRatio="none" style={{ height: H }}>
        {ticks.map((t) => {
          const y = 8 + plotH - (t / top) * plotH;
          return (
            <g key={t}>
              <line x1={padL} x2={W} y1={y} y2={y} className={s.grid} />
              <text x={padL - 6} y={y + 4} className={s.axis} textAnchor="end">
                {valueFormat(t)}
              </text>
            </g>
          );
        })}
        {bars.map((b, i) => {
          const h = (b.value / top) * plotH;
          const x = padL + i * bw + 1;
          const w = Math.max(2, bw - 2);
          const y = 8 + plotH - h;
          const r = Math.min(4, w / 2, h);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * bw} y={8} width={bw} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${8 + plotH} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${8 + plotH} Z`}
                  className={hover === i ? s.barHover : s.bar}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={padL + i * bw + bw / 2} y={H - 6} className={s.axis} textAnchor="middle">
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className={s.tip} style={{ left: `${((padL + hover * bw + bw / 2) / W) * 100}%` }} role="status">
          {bars[hover].tooltip}
        </div>
      )}
      <table className="vn-visually-hidden">
        <caption>{label}</caption>
        <tbody>
          {bars.map((b, i) => (
            <tr key={i}>
              <th>{b.label}</th>
              <td>{b.tooltip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function niceTicks(max: number, integer?: boolean): number[] {
  const step0 = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  let step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= step0) ?? step0;
  if (integer) step = Math.max(1, Math.ceil(step));
  const out = [];
  for (let v = 0; v <= max + step * 0.999; v += step) out.push(Math.round(v * 100) / 100);
  if (out.length < 2) out.push(step);
  return out;
}
