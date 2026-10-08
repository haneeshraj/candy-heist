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

// The server and Stripe, as stand-ins: an open invoice, a payment that goes through.
const server = vi.hoisted(() => ({
  lookUpInvoice: vi.fn(),
  startInvoicePayment: vi.fn(),
  finishInvoicePayment: vi.fn()
}));
vi.mock('@/lib/invoices/actions', () => server);
const stripe = vi.hoisted(() => ({ confirmCardPayment: vi.fn() }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => children,
  CardNumberElement: () => <div />,
  CardExpiryElement: () => <div />,
  CardCvcElement: () => <div />,
  useStripe: () => stripe,
  useElements: () => ({ getElement: () => ({}) })
}));
vi.mock('@/lib/payments/client', () => ({
  getStripeJs: () => Promise.resolve({})
}));

const OPEN = {
  id: 'CH-7Q4K2M-2',
  itemName: 'Mixing',
  totalCents: 12000,
  paidCents: 6000,
  dueCents: 6000,
  status: 'open' as const
};

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
    server.lookUpInvoice
      .mockReset()
      .mockResolvedValue({ ok: true, invoice: OPEN });
    server.startInvoicePayment
      .mockReset()
      .mockResolvedValue({ ok: true, clientSecret: 'pi_secret' });
    server.finishInvoicePayment.mockReset().mockResolvedValue({
      ok: true,
      paid: { id: OPEN.id, paidAt: '2026-10-08T12:00:00.000Z' }
    });
    stripe.confirmCardPayment
      .mockReset()
      .mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
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
    await user.type(screen.getByLabelText(/^Invoice ID/), 'ch-7q4k2m-2');
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
    expect(server.lookUpInvoice).toHaveBeenCalledWith('ch-7q4k2m-2');
    expect(window.location.search).toBe('?invoice=CH-7Q4K2M-2');
    await user.type(screen.getByLabelText(copy.pay.card.name), 'Alex Martin');
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
    expect(server.startInvoicePayment).toHaveBeenCalledWith(OPEN.id);
    expect(server.finishInvoicePayment).toHaveBeenCalledWith(
      OPEN.id,
      'pi_secret'
    );
  });

  it('says so when there’s no such invoice', async () => {
    const user = userEvent.setup();
    server.lookUpInvoice.mockResolvedValue({ ok: false, reason: 'notFound' });
    render(<PayInvoice copy={copy} />);
    await user.type(screen.getByLabelText(/^Invoice ID/), 'CH-NOPE22-2');
    await user.click(
      screen.getByRole('button', { ...ALL, name: copy.find.cta })
    );
    expect(
      await screen.findByText(copy.find.errors.notFound)
    ).toBeInTheDocument();
  });

  it('goes straight to paid for an invoice that already is', async () => {
    server.lookUpInvoice.mockResolvedValue({
      ok: true,
      invoice: { ...OPEN, status: 'paid' }
    });
    window.history.replaceState(null, '', '/services/pay?invoice=CH-7Q4K2M-2');
    render(<PayInvoice copy={copy} />);
    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: copy.paid.heading
      })
    ).toBeInTheDocument();
    expect(server.startInvoicePayment).not.toHaveBeenCalled();
  });

  it('looks up an invoice brought in by the email’s link', async () => {
    window.history.replaceState(null, '', '/services/pay?invoice=CH-7Q4K2M-2');
    render(<PayInvoice copy={copy} />);
    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: copy.pay.heading
      })
    ).toBeInTheDocument();
    expect(server.lookUpInvoice).toHaveBeenCalledWith('CH-7Q4K2M-2');
  });
});
