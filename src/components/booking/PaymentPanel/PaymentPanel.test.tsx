import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoiceCopy } from '@/content/services/invoice';
import type { CardPayer } from '@/lib/payments/client';
import PaymentPanel from './PaymentPanel';

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

// Stripe's fields are frames of Stripe's own; here they're stand-ins, and
// confirming is a spy.
const stripe = vi.hoisted(() => ({ confirmCardPayment: vi.fn() }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => children,
  CardNumberElement: () => <div data-testid="card-number" />,
  CardExpiryElement: () => <div data-testid="card-expiry" />,
  CardCvcElement: () => <div data-testid="card-cvc" />,
  useStripe: () => stripe,
  useElements: () => ({ getElement: () => ({ card: true }) })
}));
vi.mock('@/lib/payments/client', () => ({
  getStripeJs: () => Promise.resolve({})
}));

const copy = invoiceCopy.pay;
const TERMS = new RegExp(copy.terms.link);

function renderPanel(onPay: (payer: CardPayer) => void = vi.fn(), open = true) {
  render(
    <PaymentPanel
      copy={copy}
      amount="$60"
      paying={false}
      open={open}
      onPay={onPay}
    />
  );
  return onPay;
}

describe('PaymentPanel', () => {
  beforeEach(() => stripe.confirmCardPayment.mockReset());

  it('won’t pay without the name on the card, or the terms accepted', async () => {
    const user = userEvent.setup();
    const onPay = renderPanel();
    const name = screen.getByLabelText(copy.card.name);
    const box = screen.getByRole('checkbox', { name: TERMS });
    const pay = screen.getByRole('button', { name: /^Pay/ });

    await user.click(pay);
    expect(onPay).not.toHaveBeenCalled();
    expect(screen.getByText(copy.card.nameMissing)).toBeInTheDocument();
    expect(name).toHaveFocus();

    await user.type(name, 'Alex Martin');
    await user.click(pay);
    expect(onPay).not.toHaveBeenCalled();
    expect(screen.getByText(copy.terms.error)).toBeInTheDocument();
    expect(box).toHaveFocus();
    expect(box).toHaveAttribute('aria-invalid', 'true');

    await user.click(box);
    expect(screen.queryByText(copy.terms.error)).not.toBeInTheDocument();
    await user.click(pay);
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it('confirms with the card through Stripe, and passes on what the bank said', async () => {
    const user = userEvent.setup();
    let payer: CardPayer | null = null;
    renderPanel((given) => {
      payer = given;
    });
    await user.type(screen.getByLabelText(copy.card.name), 'Alex Martin');
    await user.click(screen.getByRole('checkbox', { name: TERMS }));
    await user.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(payer).not.toBeNull();
    const confirm = (payer as unknown as CardPayer).confirm;

    stripe.confirmCardPayment.mockResolvedValueOnce({
      paymentIntent: { status: 'succeeded' }
    });
    await expect(
      confirm('pi_secret', { email: 'alex@example.com' })
    ).resolves.toEqual({ ok: true });
    expect(stripe.confirmCardPayment).toHaveBeenCalledWith('pi_secret', {
      payment_method: {
        card: { card: true },
        billing_details: { name: 'Alex Martin', email: 'alex@example.com' }
      }
    });

    stripe.confirmCardPayment.mockResolvedValueOnce({
      error: { message: 'Your card was declined.' }
    });
    await expect(confirm('pi_secret', {})).resolves.toEqual({
      ok: false,
      message: 'Your card was declined.'
    });
    expect(
      await screen.findByText('Your card was declined.')
    ).toBeInTheDocument();
  });

  it('says payment isn’t open while it can’t be taken', () => {
    renderPanel(vi.fn(), false);
    expect(screen.getByText(copy.notOpen)).toBeInTheDocument();
    expect(screen.queryByTestId('card-number')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeDisabled();
  });

  it('asks to read the terms, linked in a new tab', () => {
    renderPanel();
    const link = screen.getByRole('link', { name: TERMS });
    expect(link).toHaveAttribute('href', '/terms');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(
      copy.terms.note
    );
  });
});
