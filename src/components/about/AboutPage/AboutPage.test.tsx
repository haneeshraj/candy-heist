import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aboutContent } from '@/content/about/about';
import AboutPage from './AboutPage';

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

// Every animated letter and word is primed with gsap.set on mount, which
// reads computed styles, and jsdom makes that very slow at this page's
// size. The reveals aren't under test here, so priming is skipped.
vi.mock('@/lib/animation/gsap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/animation/gsap')>();
  return { ...actual, gsap: { ...actual.gsap, set: () => undefined } };
});

const { intro, who, nayara, behind, continues } = aboutContent;

// The page is thousands of animated letter and word spans; checking each
// one's visibility makes role queries crawl, and nothing here is hidden
// from assistive tech anyway (the stylesheets don't load in tests).
const all = { hidden: true } as const;

describe('AboutPage', () => {
  it('opens on the intro heading', () => {
    render(<AboutPage content={aboutContent} />);
    expect(
      screen.getByRole('heading', {
        ...all,
        level: 1,
        name: `${intro.lead} ${intro.statement}`
      })
    ).toBeInTheDocument();
  });

  it('names each screen by its heading', () => {
    render(<AboutPage content={aboutContent} />);
    for (const name of [
      who.label,
      `${nayara.lead} ${nayara.statement.replace(/\n/g, ' ')}`,
      behind.headline,
      continues.headline
    ])
      expect(screen.getByRole('region', { ...all, name })).toBeInTheDocument();
  });

  it('lists every role under behind the signal', () => {
    render(<AboutPage content={aboutContent} />);
    const region = screen.getByRole('region', {
      ...all,
      name: behind.headline
    });
    for (const role of behind.roles)
      expect(
        within(region).getByRole('heading', {
          ...all,
          level: 3,
          name: role.title
        })
      ).toBeInTheDocument();
  });

  it('links to the lore, the music and the contact page', () => {
    render(<AboutPage content={aboutContent} />);
    for (const link of [nayara.cta, continues.listen, continues.contact])
      expect(
        screen.getByRole('link', {
          ...all,
          name: new RegExp(`^${link.label}$`, 'i')
        })
      ).toHaveAttribute('href', link.href);
  });

  it('links to his streaming profiles, beside who he is', () => {
    render(<AboutPage content={aboutContent} />);
    const region = screen.getByRole('region', { ...all, name: who.label });
    const list = within(region).getByRole('list', {
      ...all,
      name: who.streamingLabel
    });
    expect(within(list).getAllByRole('link', all)).toHaveLength(
      aboutContent.streaming.length
    );
  });
});
