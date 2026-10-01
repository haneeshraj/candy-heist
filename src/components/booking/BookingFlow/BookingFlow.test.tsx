import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commissions, sessions } from '@/content/services/catalogue';
import {
  commissionsFlowContent,
  sessionsFlowContent
} from '@/content/services/flows';
import { siteContact } from '@/content/site/contact';
import { slotsFor } from '@/lib/booking/availability';
import { addDays, todayIn, type DateKey } from '@/lib/booking/dates';
import BookingFlow from './BookingFlow';

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

// The whole flow renders hundreds of animated letter spans, and role
// queries check every ancestor's styles to rule out hidden elements, which
// is slow in jsdom. Nothing here is hidden (reduced motion is on), so the
// queries skip that check, and the file gets a longer timeout.
vi.setConfig({ testTimeout: 30000 });
const ALL = { hidden: true } as const;

// Reduced motion, so step changes swap at once.
function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

// The first open time from tomorrow on, so a draft can resume past the
// date step.
function openSlot() {
  const today = todayIn(sessionsFlowContent.timeZone);
  for (let day = 1; day < 60; day++) {
    const date: DateKey = addDays(today, day);
    const slot = slotsFor(date, today).find((s) => s.open);
    if (slot) return { date, time: slot.time };
  }
  throw new Error('No open time in the next 60 days');
}

const renderSessions = () =>
  render(
    <BookingFlow
      kind="session"
      content={sessionsFlowContent}
      items={sessions}
      contact={siteContact}
    />
  );

const renderCommissions = () =>
  render(
    <BookingFlow
      kind="commission"
      content={commissionsFlowContent}
      items={commissions}
      contact={siteContact}
    />
  );

describe('BookingFlow', () => {
  beforeEach(() => {
    mockMatchMedia();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/services/sessions');
  });

  it('opens on the intro, every session a card that links to its details', () => {
    renderSessions();
    expect(
      screen.getByRole('heading', {
        ...ALL,
        level: 1,
        name: sessionsFlowContent.title
      })
    ).toBeInTheDocument();
    const card = screen.getByRole('link', { ...ALL, name: /^DJ Lessons/ });
    expect(card).toHaveAttribute('href', '?step=session&session=dj-lessons');
    expect(
      screen.queryByRole('navigation', {
        ...ALL,
        name: sessionsFlowContent.stepsLabel
      })
    ).not.toBeInTheDocument();
  });

  it('opens a session’s details straight from its card', async () => {
    const user = userEvent.setup();
    renderSessions();

    await user.click(screen.getByRole('link', { ...ALL, name: /^DJ Lessons/ }));

    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: 'DJ Lessons'
      })
    ).toBeInTheDocument();
    expect(window.location.search).toBe('?step=session&session=dj-lessons');
    // Its write-up, from markdown: a heading and its list.
    expect(
      screen.getByRole('heading', { ...ALL, level: 3, name: 'What’s included' })
    ).toBeInTheDocument();
    const steps = screen.getByRole('navigation', {
      ...ALL,
      name: sessionsFlowContent.stepsLabel
    });
    expect(within(steps).getAllByRole('listitem', ALL)).toHaveLength(4);
  });

  it('opens straight onto a session linked in the URL', async () => {
    window.history.replaceState(
      null,
      '',
      '/services/sessions?session=production-session'
    );
    renderSessions();
    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: 'Production Session'
      })
    ).toBeInTheDocument();
  });

  it('needs the Discord username once Discord is where to meet', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      'candy-heist:session-draft',
      JSON.stringify({
        itemId: 'dj-lessons',
        ...openSlot(),
        details: {},
        detailsDone: false
      })
    );
    window.history.replaceState(null, '', '/services/sessions?step=details');
    renderSessions();

    const discord = await screen.findByRole('radio', {
      ...ALL,
      name: 'Discord'
    });
    await user.click(discord);
    await user.type(screen.getByLabelText(/^Name/), 'Alex Martin');
    await user.type(screen.getByLabelText(/^Email/), 'alex@example.com');
    await user.click(
      screen.getByRole('button', {
        ...ALL,
        name: sessionsFlowContent.details.cta
      })
    );
    expect(
      await screen.findByText(
        sessionsFlowContent.details.errors.discordRequired
      )
    ).toBeInTheDocument();
    expect(window.location.search).toContain('step=details');
  });
});

describe('BookingFlow, commissions', () => {
  beforeEach(() => {
    mockMatchMedia();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/services/commissions');
  });

  it('goes from a commission straight to your details, then pays in full', async () => {
    const user = userEvent.setup();
    renderCommissions();

    await user.click(
      screen.getByRole('link', { ...ALL, name: /^Mixing Balanced/ })
    );
    const steps = await screen.findByRole('navigation', {
      ...ALL,
      name: commissionsFlowContent.stepsLabel
    });
    expect(within(steps).getAllByRole('listitem', ALL)).toHaveLength(3);

    await user.click(
      screen.getByRole('button', {
        ...ALL,
        name: commissionsFlowContent.item.cta
      })
    );
    expect(window.location.search).toBe('?step=details&commission=mixing');
    // No choice of where to meet for a commission.
    expect(
      screen.queryByRole('radiogroup', { ...ALL, name: /Meet on/ })
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Name/), 'Alex Martin');
    await user.type(screen.getByLabelText(/^Email/), 'alex@example.com');
    await user.click(
      screen.getByRole('button', {
        ...ALL,
        name: commissionsFlowContent.details.cta
      })
    );
    await user.click(
      await screen.findByRole('button', { ...ALL, name: /^Pay/ })
    );

    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: commissionsFlowContent.confirmation.heading
      })
    ).toBeInTheDocument();
    // How to reach Candy, each a click to copy.
    expect(
      screen.getByRole('button', { ...ALL, name: siteContact.email })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { ...ALL, name: siteContact.discord })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        ...ALL,
        name: commissionsFlowContent.confirmation.services
      })
    ).toHaveAttribute('href', '/services');
  });
});
