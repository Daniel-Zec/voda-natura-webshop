import { periodLabels, type PeriodKey } from '../lib/period';
import { Input, Select } from './ui';
import s from '../screens/screens.module.css';

export function PeriodPicker({
  value,
  onChange,
  custom,
  onCustom,
  options = ['week', 'month', 'lastMonth', '30', 'custom'],
}: {
  value: PeriodKey;
  onChange: (v: PeriodKey) => void;
  custom: { from: string; to: string };
  onCustom: (v: { from: string; to: string }) => void;
  options?: PeriodKey[];
}) {
  return (
    <div className={s.period}>
      <Select value={value} onChange={(e) => onChange(e.target.value as PeriodKey)} aria-label="Period" style={{ width: 'auto' }}>
        {options.map((k) => (
          <option key={k} value={k}>
            {periodLabels[k]}
          </option>
        ))}
      </Select>
      {value === 'custom' && (
        <>
          <Input type="date" aria-label="Od" value={custom.from} onChange={(e) => onCustom({ ...custom, from: e.target.value })} />
          <span>–</span>
          <Input type="date" aria-label="Do" value={custom.to} onChange={(e) => onCustom({ ...custom, to: e.target.value })} />
        </>
      )}
    </div>
  );
}
