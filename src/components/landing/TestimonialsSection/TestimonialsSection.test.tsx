import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { testimonialsContent } from '@/content/home/testimonials';
import TestimonialsSection from './TestimonialsSection';

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

const { testimonials } = testimonialsContent;

// jsdom matches no media query, so nothing animates: quotes change at once.
const showing = () =>
  screen.getAllByRole('group', { hidden: true }).find((slide) => {
    return slide.getAttribute('aria-hidden') !== 'true';
  })!;

describe('TestimonialsSection', () => {
  it('is a region named by its headline, with a carousel of quotes', () => {
    render(<TestimonialsSection content={testimonialsContent} />);
    const { lead, statement } = testimonialsContent.headline;
    expect(
      screen.getByRole('region', { name: `${lead} ${statement}` })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: testimonialsContent.label })
    ).toHaveAttribute('aria-roledescription', 'carousel');
  });

  it('shows the first quote, who said it and what they booked', () => {
    render(<TestimonialsSection content={testimonialsContent} />);
    const slide = showing();
    const [first] = testimonials;
    expect(within(slide).getByText(first.quote)).toBeInTheDocument();
    expect(within(slide).getByText(first.name)).toBeInTheDocument();
    expect(within(slide).getByText(first.service.name)).toBeInTheDocument();
    // The rest are out of sight and out of reach.
    const hidden = screen
      .getAllByRole('group', { hidden: true })
      .filter((s) => s !== slide);
    expect(hidden).toHaveLength(testimonials.length - 1);
    hidden.forEach((s) => expect(s).toHaveAttribute('inert'));
  });

  it('offers the one main action, to the booking page', () => {
    render(<TestimonialsSection content={testimonialsContent} />);
    expect(
      screen.getByRole('link', { name: testimonialsContent.cta.label })
    ).toHaveAttribute('href', '/sessions');
  });

  it('jumps to a quote from its dot', () => {
    render(<TestimonialsSection content={testimonialsContent} />);
    const third = testimonials[2];
    const dot = screen.getByRole('button', {
      name: `Show quote 3 of ${testimonials.length}`
    });
    fireEvent.click(dot);
    expect(within(showing()).getByText(third.quote)).toBeInTheDocument();
    expect(within(showing()).getByText(third.service.name)).toBeInTheDocument();
    expect(dot).toHaveAttribute('aria-current', 'true');
  });

  it('can be paused, and played again', () => {
    render(<TestimonialsSection content={testimonialsContent} />);
    const { pause, play } = testimonialsContent.controls;
    fireEvent.click(screen.getByRole('button', { name: pause }));
    fireEvent.click(screen.getByRole('button', { name: play }));
    expect(screen.getByRole('button', { name: pause })).toBeInTheDocument();
  });
});
