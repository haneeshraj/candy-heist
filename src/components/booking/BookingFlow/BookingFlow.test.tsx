import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingContent } from '@/content/booking/booking';
import { services } from '@/content/sessions/services';
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

// Reduced motion, so step changes swap at once.
function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

describe('BookingFlow', () => {
  beforeEach(() => {
    mockMatchMedia();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/sessions');
  });

  it('opens on the intro with every session to pick from, and no way on yet', () => {
    render(<BookingFlow content={bookingContent} services={services} />);
    expect(
      screen.getByRole('heading', { level: 1, name: bookingContent.title })
    ).toBeInTheDocument();
    const group = screen.getByRole('radiogroup', {
      name: bookingContent.choose.heading
    });
    expect(within(group).getAllByRole('radio')).toHaveLength(services.length);
    expect(
      screen.queryByRole('button', { name: bookingContent.choose.next })
    ).not.toBeInTheDocument();
  });

  it('picking a session brings in Next, which opens its details', async () => {
    const user = userEvent.setup();
    render(<BookingFlow content={bookingContent} services={services} />);

    await user.click(screen.getByRole('radio', { name: /^DJ Lessons/ }));
    await user.click(
      await screen.findByRole('button', { name: bookingContent.choose.next })
    );

    expect(
      await screen.findByRole('heading', { level: 2, name: 'DJ Lessons' })
    ).toBeInTheDocument();
    expect(window.location.search).toBe('?step=session&session=dj-lessons');
    expect(
      screen.getByRole('navigation', { name: bookingContent.stepsLabel })
    ).toBeInTheDocument();
  });

  it('opens straight onto a session linked in the URL', async () => {
    window.history.replaceState(null, '', '/sessions?session=mix-and-master');
    render(<BookingFlow content={bookingContent} services={services} />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Mix & Master' })
    ).toBeInTheDocument();
  });
});
