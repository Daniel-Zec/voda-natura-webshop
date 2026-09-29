import { useId } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  /** Where the form sends the query (GET ?q=…). */
  action: string;
  placeholder?: string;
  /** Visible to screen readers only. */
  label?: string;
  /** Text on the button; without it the button shows a search icon. */
  buttonLabel?: string;
  /** muted = grey field in the header · warm = white field with sand border on warm panels */
  tone?: 'muted' | 'warm';
  size?: 'md' | 'lg';
  defaultValue?: string;
}

/** Product search by name or SKU. Works without JavaScript (plain GET form). */
export function SearchBar({
  action,
  placeholder = 'Pretražite proizvode ili šifru, npr. BL 10',
  label = 'Pretraga',
  buttonLabel,
  tone = 'muted',
  size = 'md',
  defaultValue,
}: SearchBarProps) {
  const id = useId();
  return (
    <form role="search" action={action} method="get" className={[styles.form, styles[tone], styles[size]].join(' ')}>
      <label htmlFor={id} className="vn-visually-hidden">
        {label}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        className={styles.input}
      />
      <button type="submit" className={[styles.submit, buttonLabel ? styles.withText : ''].join(' ')} aria-label={buttonLabel ? undefined : 'Traži'}>
        {buttonLabel ?? <Icon name="search" size={20} strokeWidth={2.2} />}
      </button>
    </form>
  );
}
