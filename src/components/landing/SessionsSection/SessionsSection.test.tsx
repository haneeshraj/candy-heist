import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sessionsContent } from '@/content/home/sessions';
import SessionsSection from './SessionsSection';

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

describe('SessionsSection', () => {
  it('is a region named by its headline', () => {
    render(<SessionsSection content={sessionsContent} />);
    const section = screen.getByRole('region', {
      name: 'One on one, In the studio.'
    });
    expect(
      within(section).getByRole('heading', { level: 2 })
    ).toHaveTextContent('One on one, In the studio.');
  });

  it('lists every service by name with its one line, and nothing to click', () => {
    render(<SessionsSection content={sessionsContent} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(sessionsContent.services.length);

    sessionsContent.services.forEach((service, i) => {
      const item = within(items[i]);
      expect(
        item.getByRole('heading', { level: 3, name: service.name })
      ).toBeInTheDocument();
      expect(item.getByText(service.summary)).toBeInTheDocument();
      expect(item.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('offers the one booking action and shows the photo', () => {
    render(<SessionsSection content={sessionsContent} />);
    expect(
      screen.getByRole('link', { name: sessionsContent.cta.label })
    ).toHaveAttribute('href', sessionsContent.cta.href);
    expect(screen.getByAltText(sessionsContent.photo.alt)).toHaveAttribute(
      'src',
      sessionsContent.photo.src
    );
  });

  it('reads the label and status as plain text', () => {
    render(<SessionsSection content={sessionsContent} />);
    expect(screen.getByText(sessionsContent.label)).toBeInTheDocument();
    expect(screen.getByText(sessionsContent.status)).toBeInTheDocument();
  });
});
