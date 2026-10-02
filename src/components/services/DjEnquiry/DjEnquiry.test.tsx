import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { djEnquiryContent as content } from '@/content/services/djEnquiry';
import { siteContact } from '@/content/site/contact';
import DjEnquiry from './DjEnquiry';

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

// The real one files in the database; here it hands the enquiry back as
// the server would, tidied.
vi.mock('@/lib/enquiry/sendEnquiry', () => ({
  sendEnquiry: vi.fn(async (raw: Record<string, string>) => ({
    ok: true,
    sent: Object.fromEntries(
      Object.entries(raw).map(([field, value]) => [field, value.trim()])
    )
  }))
}));

vi.setConfig({ testTimeout: 30000 });
const ALL = { hidden: true } as const;
const { form, sent } = content;

describe('DjEnquiry', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  it('is named by its headline, with the email for anyone who’d rather write', () => {
    render(<DjEnquiry content={content} contact={siteContact} />);
    expect(
      screen.getByRole('heading', {
        ...ALL,
        level: 1,
        name: `${content.intro.lead} ${content.intro.statement}`
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { ...ALL, name: siteContact.email })
    ).toHaveAttribute('href', `mailto:${siteContact.email}`);
  });

  it('asks for the name, email, budget and event before it sends', async () => {
    const user = userEvent.setup();
    render(<DjEnquiry content={content} contact={siteContact} />);

    await user.click(screen.getByRole('button', { ...ALL, name: form.send }));
    for (const message of [
      form.errors.name,
      form.errors.email,
      form.errors.budget,
      form.errors.about
    ])
      expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveFocus();
  });

  it('sends, then says so beside a slip of what went', async () => {
    const user = userEvent.setup();
    render(<DjEnquiry content={content} contact={siteContact} />);

    await user.type(screen.getByLabelText(/^Name/), 'Alex Martin');
    await user.type(screen.getByLabelText(/^Title/), 'Booking agent');
    await user.type(screen.getByLabelText(/^Email/), 'alex@nightfall.events');
    await user.type(screen.getByLabelText(/^Event name/), 'Rooftop Series');
    await user.type(screen.getByLabelText(/^Budget/), '$1,500');
    await user.type(
      screen.getByRole('textbox', { ...ALL, name: /^Tell me about the event/ }),
      'Three Saturdays in July.'
    );
    await user.click(screen.getByRole('button', { ...ALL, name: form.send }));

    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: sent.heading
      })
    ).toBeInTheDocument();
    const slip = screen.getByRole('complementary', {
      ...ALL,
      name: sent.slip.subject
    });
    expect(within(slip).getByText('Rooftop Series')).toBeInTheDocument();
    expect(within(slip).getByText('$1,500')).toBeInTheDocument();
    expect(
      within(slip).getByText('From Alex Martin · Booking agent')
    ).toBeInTheDocument();
    // No venue given, so no venue row.
    expect(within(slip).queryByText(sent.slip.venue)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { ...ALL, name: sent.services })
    ).toHaveAttribute('href', '/services');
  });
});
