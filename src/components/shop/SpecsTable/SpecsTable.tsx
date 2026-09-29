import styles from './SpecsTable.module.css';

export interface SpecsTableProps {
  specs: { label: string; value: string }[];
  caption?: string;
}

/** Technical specifications as a real HTML table (SEO guide: never an image). */
export function SpecsTable({ specs, caption = 'Tehničke karakteristike' }: SpecsTableProps) {
  if (!specs.length) return null;
  return (
    <table className={styles.table}>
      <caption className="vn-visually-hidden">{caption}</caption>
      <tbody>
        {specs.map((s) => (
          <tr key={s.label + s.value}>
            <th scope="row">{s.label}</th>
            <td>{s.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
