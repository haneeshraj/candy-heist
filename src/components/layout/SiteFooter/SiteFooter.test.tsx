import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { footerContent } from '@/content/site/footer';
import SiteFooter from './SiteFooter';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  )
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}));

describe('SiteFooter', () => {
  it('reads the sign-off as one heading', () => {
    render(<SiteFooter content={footerContent} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Plan the next Heist.' })
    ).toBeInTheDocument();
  });

  it('shows the photo inside the vortex', () => {
    render(<SiteFooter content={footerContent} />);
    expect(screen.getByAltText(footerContent.photo.alt)).toHaveAttribute(
      'src',
      footerContent.photo.src
    );
  });

  it('links the bookings address as a mailto', () => {
    render(<SiteFooter content={footerContent} />);
    expect(
      screen.getByRole('link', { name: footerContent.email })
    ).toHaveAttribute('href', `mailto:${footerContent.email}`);
  });

  it('opens the social links in a new tab and says so', () => {
    render(<SiteFooter content={footerContent} />);
    const follow = screen.getByRole('list', {
      name: footerContent.follow.label
    });
    const links = within(follow).getAllByRole('link');
    expect(links).toHaveLength(footerContent.follow.links.length);
    for (const [i, link] of links.entries()) {
      expect(link).toHaveAccessibleName(
        `${footerContent.follow.links[i].label} (opens in a new tab)`
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('lists the site pages in a labelled navigation', () => {
    render(<SiteFooter content={footerContent} />);
    const nav = screen.getByRole('navigation', {
      name: footerContent.navigate.label
    });
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(footerContent.navigate.links.map((l) => l.href));
  });

  it('closes with the copyright line and the terms', () => {
    render(<SiteFooter content={footerContent} />);
    expect(screen.getByText(footerContent.copyright)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: footerContent.terms.label })
    ).toHaveAttribute('href', '/terms');
  });
});
