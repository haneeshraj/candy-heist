import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { discographyContent } from '@/content/home/discography';
import { SHELF_POOL } from '@/lib/shelf/shelf';
import DiscographySection from './DiscographySection';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
  getImageProps: ({ src, sizes }: { src: string; sizes?: string }) => ({
    props: { src, srcSet: `${src} 1x`, sizes }
  })
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

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

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

describe('DiscographySection', () => {
  it('reads the headline as one heading', () => {
    render(<DiscographySection content={discographyContent} />);
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'The archive, Remembered.'
      })
    ).toBeInTheDocument();
  });

  it('shows the first release with its square cover', () => {
    render(<DiscographySection content={discographyContent} />);
    const [first] = discographyContent.releases;
    expect(
      screen.getByText(first.title, { selector: 'p' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(first.artist, { selector: 'p' })
    ).toBeInTheDocument();
    expect(screen.getByAltText(first.cover.alt)).toHaveAttribute(
      'src',
      first.cover.src
    );
  });

  it('links to the discography page', () => {
    render(<DiscographySection content={discographyContent} />);
    expect(screen.getByRole('link', { name: 'Discography' })).toHaveAttribute(
      'href',
      '/discography'
    );
  });

  it('puts every visible tape on the shelf, each linking to its release', () => {
    const { container } = render(
      <DiscographySection content={discographyContent} />
    );
    const tapes = container.querySelectorAll('[data-interactive] a');
    expect(tapes).toHaveLength(SHELF_POOL);
    const hrefs = [...tapes].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/discography/4x4');
  });

  it('keeps the phone shelf out of the tab order and the accessibility tree', () => {
    // jsdom matches no media query, so this renders the phone layout.
    const { container } = render(
      <DiscographySection content={discographyContent} />
    );
    const shelf = container.querySelector('[data-interactive]');
    expect(shelf).toHaveAttribute('data-interactive', 'false');
    expect(shelf).toHaveAttribute('aria-hidden', 'true');
    expect(
      container.querySelectorAll('[data-interactive] a[tabindex="0"]')
    ).toHaveLength(0);
  });
});
