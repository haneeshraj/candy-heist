import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { contactContent } from '@/content/home/contact';
import ContactSection from './ContactSection';

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

describe('ContactSection', () => {
  it('is a region named by its headline', () => {
    render(<ContactSection content={contactContent} />);
    const section = screen.getByRole('region', {
      name: 'Got a question? Send a signal.'
    });
    expect(
      within(section).getByRole('heading', { level: 2 })
    ).toHaveTextContent('Got a question? Send a signal.');
  });

  it('lists the email and phone as links', () => {
    render(<ContactSection content={contactContent} />);
    const links = within(screen.getByRole('list')).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', `mailto:${contactContent.email}`);
    expect(links[0]).toHaveTextContent(contactContent.email);
    expect(links[0]).not.toHaveAttribute('target');
    expect(links[1]).toHaveAttribute('href', contactContent.phone.href);
    expect(links[1]).toHaveTextContent(contactContent.phone.label);
  });

  it('offers the one main action', () => {
    render(<ContactSection content={contactContent} />);
    expect(
      screen.getByRole('link', { name: contactContent.cta.label })
    ).toHaveAttribute('href', contactContent.cta.href);
    expect(
      screen.getByRole('link', { name: contactContent.secondary.label })
    ).toHaveAttribute('href', contactContent.secondary.href);
  });

  it('reads the label as plain text', () => {
    render(<ContactSection content={contactContent} />);
    // The button says it too; the label is the one in the paragraph.
    expect(
      screen.getByText(contactContent.label, { selector: 'p > span' })
    ).toBeInTheDocument();
  });
});
