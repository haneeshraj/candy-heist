import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode
} from 'react';

export type SigilChipVariant = 'outline' | 'solid' | 'ghost';
export type SigilChipSize = 'md' | 'sm';

export interface SigilChipResponsiveSize {
  /** Size below the desktop breakpoint. */
  base: SigilChipSize;
  /** Size from the desktop breakpoint up. @default base */
  desktop?: SigilChipSize;
}

export interface SigilChipOwnProps {
  /**
   * 'outline' is the default CTA, 'solid' is for the single strongest action
   * on a page, 'ghost' is for tight or inline spots.
   * @default 'outline'
   */
  variant?: SigilChipVariant;
  /**
   * 'md' is 48 px tall (a comfortable touch target), 'sm' is 34 px. Pass
   * `{ base, desktop }` to switch size at the desktop breakpoint.
   * @default 'md'
   */
  size?: SigilChipSize | SigilChipResponsiveSize;
  /**
   * Glyph shown in the ring. Leave it out for the Sonoalchemy sigil, pass any
   * icon that fits the context, or `null` for a label-only chip.
   */
  icon?: ReactNode | null;
  /**
   * Turns the glyph 45° on hover.
   * @default true for the default sigil, false for custom icons
   */
  spinIcon?: boolean;
  /** Pulls toward the pointer on fine-pointer devices. @default true */
  magnetic?: boolean;
  /**
   * Sets the label in capitals. Turn it off for text whose case matters to
   * the reader, like an email address.
   * @default true
   */
  uppercase?: boolean;
  /** The label. Leave it out for an icon-only chip, which then needs an `aria-label`. */
  children?: ReactNode;
  className?: string;
}

export type SigilChipButtonProps = SigilChipOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SigilChipOwnProps> & {
    href?: never;
  };

export type SigilChipLinkProps = SigilChipOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof SigilChipOwnProps | 'href'
  > & {
    href: string;
    /**
     * Opens in a new tab with rel="noopener noreferrer".
     * @default true for absolute http(s) URLs
     */
    external?: boolean;
    /** Renders a non-interactive chip in the disabled style. */
    disabled?: boolean;
  };

export type SigilChipProps = SigilChipButtonProps | SigilChipLinkProps;
