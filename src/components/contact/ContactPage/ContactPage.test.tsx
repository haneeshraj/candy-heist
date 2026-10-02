import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { contactPageContent } from '@/content/contact/contact';
import ContactPage from './ContactPage';

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

// The real one files in the database; here it answers as the server would.
vi.mock('@/lib/contact/sendMessage', () => ({
  sendMessage: vi.fn(async (raw: { name: string; email: string }) => ({
    ok: true,
    sent: { name: raw.name.trim(), email: raw.email.trim() }
  }))
}));

const { form: copy } = contactPageContent;

function setup() {
  render(<ContactPage content={contactPageContent} />);
  const toggle = screen.getByRole('button', { name: copy.details });
  const details = document.getElementById(
    toggle.getAttribute('aria-controls') ?? ''
  );
  const type = (label: RegExp, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const send = () =>
    fireEvent.click(screen.getByRole('button', { name: copy.send }));
  return { toggle, details, type, send };
}

// Its form fills slowly under a loaded test run.
vi.setConfig({ testTimeout: 30000 });

describe('ContactPage', () => {
  it('is a form named by the page heading, with the details closed', () => {
    const { toggle, details } = setup();
    const { lead, statement } = contactPageContent.headline;
    const name = `${lead} ${statement}`;
    expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument();
    expect(screen.getByRole('form', { name })).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(details).toHaveAttribute('inert');
  });

  it('opens and closes the details, keeping what was typed', () => {
    const { toggle, details, type } = setup();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(details).not.toHaveAttribute('inert');

    type(/^Phone/, '+1 902 555 0142');
    fireEvent.click(toggle);
    expect(details).toHaveAttribute('inert');
    expect(screen.getByLabelText(/^Phone/)).toHaveValue('+1 902 555 0142');
  });

  it('asks for the four required fields and focuses the first', () => {
    const { send } = setup();
    send();
    for (const key of ['name', 'email', 'subject', 'message'] as const)
      expect(screen.getByText(copy.errors[key])).toBeInTheDocument();
    expect(screen.getByText(/Four things need a look/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveFocus();
  });

  it('opens the details to show a phone number that needs a look', () => {
    const { toggle, type, send } = setup();
    type(/^Name/, 'Alex Martin');
    type(/^Email/, 'alex@nightfall.events');
    type(/^Subject/, 'A set in November');
    type(/^Message/, 'We run a night in Halifax.');
    fireEvent.click(toggle);
    type(/^Phone/, 'call me');
    fireEvent.click(toggle);

    send();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(copy.errors.phone)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Phone/)).toHaveFocus();
  });

  it('confirms the message, and brings back an empty form', async () => {
    const { type, send } = setup();
    type(/^Name/, 'Alex Martin');
    type(/^Email/, 'alex@nightfall.events');
    type(/^Subject/, 'A set in November');
    type(/^Message/, 'We run a night in Halifax.');
    send();

    const heading = await screen.findByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Thank you, Alex.');
    expect(heading).toHaveFocus();
    expect(screen.getByText(/alex@nightfall\.events/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: contactPageContent.sent.home.label })
    ).toHaveAttribute('href', '/');

    fireEvent.click(
      screen.getByRole('button', { name: contactPageContent.sent.again })
    );
    expect(screen.getByLabelText(/^Name/)).toHaveValue('');
  });
});
