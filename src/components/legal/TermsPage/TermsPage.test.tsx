import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { siteContact } from '@/content/site/contact';
import { termsContent } from '@/content/site/terms';
import TermsPage from './TermsPage';

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

describe('TermsPage', () => {
  it('names itself, then gives each part its heading', () => {
    render(<TermsPage content={termsContent} email={siteContact.email} />);
    expect(
      screen.getByRole('heading', {
        ...ALL,
        level: 1,
        name: `${termsContent.lead} ${termsContent.statement}`
      })
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('heading', { ...ALL, level: 2 })
        .map((h) => h.textContent)
    ).toEqual(termsContent.sections.map((s) => s.heading));
  });

  it('says payments are final, and links the booking email', () => {
    render(<TermsPage content={termsContent} email={siteContact.email} />);
    expect(screen.getByText(/All payments are final/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { ...ALL, name: siteContact.email })
    ).toHaveAttribute('href', `mailto:${siteContact.email}`);
  });
});
