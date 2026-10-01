import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { servicesPageContent } from '@/content/services/services';
import ServicesPage from './ServicesPage';

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

const ALL = { hidden: true } as const;
const content = servicesPageContent;

describe('ServicesPage', () => {
  it('is named by its headline', () => {
    render(<ServicesPage content={content} />);
    expect(
      screen.getByRole('heading', {
        ...ALL,
        level: 1,
        name: `${content.lead} ${content.statement}`
      })
    ).toBeInTheDocument();
  });

  it('opens a door to each kind of service, each with one way in', () => {
    render(<ServicesPage content={content} />);
    for (const door of content.doors) {
      const article = screen
        .getByRole('heading', { ...ALL, level: 2, name: door.title })
        .closest('article')!;
      // The door's own link is for the pointer only; the button is the one
      // stop for keyboards and assistive tech.
      const links = within(article).getAllByRole('link');
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute('href', door.cta.href);
      expect(links[0]).toHaveTextContent(door.cta.label);
    }
  });

  it('seals what is not out yet: no photo behind it', () => {
    render(<ServicesPage content={content} />);
    const soon = content.doors.find((door) => door.soon)!;
    const article = screen
      .getByRole('heading', { ...ALL, level: 2, name: soon.title })
      .closest('article')!;
    expect(article).toHaveAttribute('data-soon', 'true');
    expect(within(article).queryByRole('img', ALL)).not.toBeInTheDocument();
  });

  it('says how it works, step by step', () => {
    render(<ServicesPage content={content} />);
    const how = screen.getByRole('region', { ...ALL, name: content.how.label });
    expect(within(how).getAllByRole('listitem', ALL)).toHaveLength(
      content.how.steps.length
    );
  });
});
