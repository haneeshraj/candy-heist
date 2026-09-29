import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayIcon } from '@/components/icons';
import SigilChip from './SigilChip';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} data-next-link="true" {...rest}>
      {children}
    </a>
  )
}));

describe('SigilChip', () => {
  it('renders a button with the default sigil and outline/md styling', () => {
    render(<SigilChip>More about me</SigilChip>);
    const chip = screen.getByRole('button', { name: 'More about me' });
    expect(chip).toHaveAttribute('type', 'button');
    expect(chip).toHaveAttribute('data-variant', 'outline');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip.querySelector('svg')).not.toBeNull();
    expect(chip.querySelector('[data-spin="true"]')).not.toBeNull();
  });

  it('exposes variant and responsive size as data attributes', () => {
    render(
      <SigilChip variant="ghost" size={{ base: 'md', desktop: 'sm' }}>
        Listen
      </SigilChip>
    );
    const chip = screen.getByRole('button', { name: 'Listen' });
    expect(chip).toHaveAttribute('data-variant', 'ghost');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip).toHaveAttribute('data-size-desktop', 'sm');
  });

  it('routes internal hrefs through next/link', () => {
    render(<SigilChip href="/about">More about me</SigilChip>);
    const link = screen.getByRole('link', { name: 'More about me' });
    expect(link).toHaveAttribute('href', '/about');
    expect(link).toHaveAttribute('data-next-link', 'true');
    expect(link).not.toHaveAttribute('target');
  });

  it('opens web URLs in a new tab with a safe rel', () => {
    render(
      <SigilChip href="https://soundcloud.com/candyheist">SoundCloud</SigilChip>
    );
    const link = screen.getByRole('link', { name: 'SoundCloud' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).not.toHaveAttribute('data-next-link');
  });

  it('keeps mailto links in the same tab and off the router', () => {
    render(<SigilChip href="mailto:booking@example.com">Bookings</SigilChip>);
    const link = screen.getByRole('link', { name: 'Bookings' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('data-next-link');
  });

  it('can keep the label as typed instead of in capitals', () => {
    const { rerender } = render(<SigilChip>Bookings</SigilChip>);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-case');
    rerender(<SigilChip uppercase={false}>booking@example.com</SigilChip>);
    expect(screen.getByRole('button')).toHaveAttribute('data-case', 'as-typed');
  });

  it('supports label-only chips and custom, non-spinning icons', () => {
    const { rerender } = render(<SigilChip icon={null}>Bookings</SigilChip>);
    let chip = screen.getByRole('button', { name: 'Bookings' });
    expect(chip).toHaveAttribute('data-label-only', 'true');
    expect(chip.querySelector('svg')).toBeNull();

    rerender(<SigilChip icon={<PlayIcon />}>Listen</SigilChip>);
    chip = screen.getByRole('button', { name: 'Listen' });
    expect(chip.querySelector('svg')).not.toBeNull();
    expect(chip.querySelector('[data-spin="true"]')).toBeNull();
  });

  it('supports icon-only chips named by aria-label', () => {
    render(<SigilChip icon={<PlayIcon />} aria-label="Play the latest mix" />);
    const chip = screen.getByRole('button', { name: 'Play the latest mix' });
    expect(chip).toHaveAttribute('data-icon-only', 'true');
  });

  it('forwards clicks, and blocks them when disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<SigilChip onClick={onClick}>Go</SigilChip>);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <SigilChip onClick={onClick} disabled>
        Go
      </SigilChip>
    );
    const chip = screen.getByRole('button', { name: 'Go' });
    expect(chip).toBeDisabled();
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a disabled link as a non-interactive element', () => {
    render(
      <SigilChip href="/about" disabled>
        Coming soon
      </SigilChip>
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(
      screen.getByText('Coming soon').closest('[aria-disabled="true"]')
    ).not.toBeNull();
  });
});
