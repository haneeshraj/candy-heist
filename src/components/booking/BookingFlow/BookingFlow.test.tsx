import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogue } from '@/content/services/catalogue';
import { producerFlowContent as content } from '@/content/services/flows';
import { siteContact } from '@/content/site/contact';
import { slotsFor } from '@/lib/booking/availability';
import { addDays, todayIn, type DateKey } from '@/lib/booking/dates';
import { DRAFT_KEY } from '@/lib/booking/persistence';
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
const { commission, session } = content.kinds;

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
  const today = todayIn(content.timeZone);
  for (let day = 1; day < 60; day++) {
    const date: DateKey = addDays(today, day);
    const slot = slotsFor(date, today).find((s) => s.open);
    if (slot) return { date, time: slot.time };
  }
  throw new Error('No open time in the next 60 days');
}

const renderFlow = () =>
  render(
    <BookingFlow content={content} items={catalogue} contact={siteContact} />
  );

const cards = () =>
  screen
    .getAllByRole('link', ALL)
    .filter((link) => link.getAttribute('href')?.startsWith('?step='));

describe('BookingFlow', () => {
  beforeEach(() => {
    mockMatchMedia();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/services/producer');
  });

  it('opens on the intro, every service a tagged card linking to its details', () => {
    renderFlow();
    expect(
      screen.getByRole('heading', { ...ALL, level: 1, name: content.title })
    ).toBeInTheDocument();
    expect(cards()).toHaveLength(catalogue.length);
    const card = screen.getByRole('link', { ...ALL, name: /^DJ Lessons/ });
    expect(card).toHaveAttribute('href', '?step=service&service=dj-lessons');
    expect(card).toHaveTextContent(session.tag);
    expect(
      screen.queryByRole('navigation', { ...ALL, name: content.stepsLabel })
    ).not.toBeInTheDocument();
  });

  it('searches only when asked, and filters by kind', async () => {
    const user = userEvent.setup();
    renderFlow();

    await user.click(
      screen.getByRole('button', { ...ALL, name: content.browse.search.open })
    );
    await user.type(screen.getByRole('searchbox', ALL), 'lessons');
    expect(cards()).toHaveLength(catalogue.length);
    await user.click(
      screen.getByRole('button', {
        ...ALL,
        name: content.browse.search.submit
      })
    );
    expect(cards().map((card) => card.getAttribute('href'))).toEqual([
      '?step=service&service=dj-lessons'
    ]);

    await user.click(
      screen.getByRole('button', { ...ALL, name: content.browse.search.clear })
    );
    await user.click(
      screen.getByRole('button', {
        ...ALL,
        name: content.browse.filters.button
      })
    );
    await user.click(
      screen.getByRole('checkbox', { ...ALL, name: /^1-1 sessions/ })
    );
    expect(cards()).toHaveLength(
      catalogue.filter((item) => item.kind === 'session').length
    );
  });

  it('opens a 1-1 session’s details from its card, the list grouped by kind', async () => {
    const user = userEvent.setup();
    renderFlow();

    await user.click(screen.getByRole('link', { ...ALL, name: /^DJ Lessons/ }));

    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: 'DJ Lessons'
      })
    ).toBeInTheDocument();
    expect(window.location.search).toBe('?step=service&service=dj-lessons');
    // Its write-up, from markdown: a heading and its list.
    expect(
      screen.getByRole('heading', { ...ALL, level: 3, name: 'What’s included' })
    ).toBeInTheDocument();
    const steps = screen.getByRole('navigation', {
      ...ALL,
      name: content.stepsLabel
    });
    expect(within(steps).getAllByRole('listitem', ALL)).toHaveLength(4);
    expect(
      within(
        screen.getByRole('radiogroup', { ...ALL, name: session.group })
      ).getAllByRole('radio', ALL)
    ).toHaveLength(2);
    expect(
      screen.getByRole('radiogroup', { ...ALL, name: commission.group })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { ...ALL, name: session.item.cta })
    ).toBeInTheDocument();
  });

  it('opens straight onto an item linked in the URL, old links too', async () => {
    window.history.replaceState(
      null,
      '',
      '/services/producer?session=production-session'
    );
    renderFlow();
    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: 'Production Session'
      })
    ).toBeInTheDocument();
    expect(window.location.search).toBe(
      '?step=service&service=production-session'
    );
  });

  it('needs the Discord username once Discord is where to meet', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        itemId: 'dj-lessons',
        ...openSlot(),
        details: {},
        detailsDone: false
      })
    );
    window.history.replaceState(null, '', '/services/producer?step=details');
    renderFlow();

    const discord = await screen.findByRole('radio', {
      ...ALL,
      name: 'Discord'
    });
    await user.click(discord);
    await user.type(screen.getByLabelText(/^Name/), 'Alex Martin');
    await user.type(screen.getByLabelText(/^Email/), 'alex@example.com');
    await user.click(
      screen.getByRole('button', { ...ALL, name: content.details.cta })
    );
    expect(
      await screen.findByText(content.details.errors.discordRequired)
    ).toBeInTheDocument();
    expect(window.location.search).toContain('step=details');
  });

  it('takes a commission straight to your details, then half upfront', async () => {
    const user = userEvent.setup();
    renderFlow();

    await user.click(
      screen.getByRole('link', { ...ALL, name: /^Mixing Commission/ })
    );
    const steps = await screen.findByRole('navigation', {
      ...ALL,
      name: content.stepsLabel
    });
    expect(within(steps).getAllByRole('listitem', ALL)).toHaveLength(3);

    await user.click(
      screen.getByRole('button', { ...ALL, name: commission.item.cta })
    );
    expect(window.location.search).toBe('?step=details&service=mixing');
    // No choice of where to meet for a commission.
    expect(
      screen.queryByRole('radiogroup', { ...ALL, name: /Meet on/ })
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Name/), 'Alex Martin');
    await user.type(screen.getByLabelText(/^Email/), 'alex@example.com');
    await user.click(
      screen.getByRole('button', { ...ALL, name: content.details.cta })
    );
    expect(
      await screen.findByText(commission.payment.panel)
    ).toBeInTheDocument();
    expect(screen.getByText(commission.summary.total)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { ...ALL, name: /^Pay/ }));

    expect(
      await screen.findByRole('heading', {
        ...ALL,
        level: 2,
        name: commission.confirmation.heading
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
        name: content.confirmation.services
      })
    ).toHaveAttribute('href', '/services');
  });
});
