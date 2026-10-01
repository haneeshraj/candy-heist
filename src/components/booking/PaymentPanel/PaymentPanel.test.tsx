import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { invoiceCopy } from '@/content/services/invoice';
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

const copy = invoiceCopy.pay;
const TERMS = new RegExp(copy.terms.link);

function renderPanel(onPay = vi.fn()) {
  render(
    <PaymentPanel copy={copy} amount="£60" paying={false} onPay={onPay} />
  );
  return onPay;
}

describe('PaymentPanel', () => {
  it('won’t pay until the terms are accepted', async () => {
    const user = userEvent.setup();
    const onPay = renderPanel();
    const box = screen.getByRole('checkbox', { name: TERMS });
    const pay = screen.getByRole('button', { name: /^Pay/ });

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
