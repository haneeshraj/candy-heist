import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoiceCopy as copy } from '@/content/services/invoice';
import PayInvoice from './PayInvoice';

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

vi.setConfig({ testTimeout: 30000 });
const ALL = { hidden: true } as const;

describe('PayInvoice', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
    window.history.replaceState(null, '', '/services/pay');
  });

  it('asks for a proper ID before it looks', async () => {
    const user = userEvent.setup();
    render(<PayInvoice copy={copy} />);
    await user.click(
      screen.getByRole('button', { ...ALL, name: copy.find.cta })
    );
    expect(screen.getByText(copy.find.errors.missing)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Invoice ID/), 'no!');
    await user.click(
      screen.getByRole('button', { ...ALL, name: copy.find.cta })
    );
    expect(screen.getByText(copy.find.errors.invalid)).toBeInTheDocument();
  });

  it('finds the invoice, takes the payment and says it’s paid', async () => {
    const user = userEvent.setup();
    render(<PayInvoice copy={copy} />);
    await user.type(screen.getByLabelText(/^Invoice ID/), 'ch-7q4k2m9x');
    await user.click(
      screen.getByRole('button', { ...ALL, name: copy.find.cta })
    );

    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: copy.pay.heading
      })
    ).toBeInTheDocument();
    expect(window.location.search).toBe('?invoice=CH-7Q4K2M9X');
    await user.click(
      screen.getByRole('checkbox', {
        ...ALL,
        name: new RegExp(copy.pay.terms.link)
      })
    );
    await user.click(screen.getByRole('button', { ...ALL, name: /^Pay/ }));
    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: copy.paid.heading
      })
    ).toBeInTheDocument();
  });

  it('looks up an invoice brought in by the email’s link', async () => {
    window.history.replaceState(null, '', '/services/pay?invoice=CH-7Q4K2M9X');
    render(<PayInvoice copy={copy} />);
    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: copy.pay.heading
      })
    ).toBeInTheDocument();
  });
});
