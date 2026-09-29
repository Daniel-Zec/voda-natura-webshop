import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outlineBrand' | 'ghost';
export type ButtonSize = 'md' | 'lg';

interface CommonProps {
  /** primary = green (buy/order) · secondary = blue (guidance) · outline = neutral · outlineBrand = blue outline · ghost = text only */
  variant?: ButtonVariant;
  /** md = 48 px · lg = 52 px (hero and page-level calls to action) */
  size?: ButtonSize;
  /** Icon before the label */
  icon?: IconName;
  /** Icon after the label */
  iconAfter?: IconName;
  /** Only an icon is shown; `aria-label` becomes required */
  iconOnly?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export type ButtonProps = AsButton | AsLink;

/**
 * The one button of the shop. Renders a `<a>` when `href` is given, otherwise a `<button>`.
 * Colours come only from the action tokens (`--vn-color-action-*`).
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    icon,
    iconAfter,
    iconOnly = false,
    fullWidth = false,
    children,
    className,
    ...rest
  } = props;

  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly ? styles.iconOnly : '',
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'lg' ? 22 : 20;
  const content = (
    <>
      {icon && <Icon name={icon} size={iconSize} strokeWidth={iconOnly ? 2.4 : 2} />}
      {!iconOnly && children}
      {iconAfter && <Icon name={iconAfter} size={iconSize} />}
    </>
  );

  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    );
  }

  const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
