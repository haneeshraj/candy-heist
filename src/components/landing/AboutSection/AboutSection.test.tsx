import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aboutContent } from '@/content/home/about';
import AboutSection from './AboutSection';

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

describe('AboutSection', () => {
  it('reads the mirrored headline as one sentence', () => {
    render(<AboutSection content={aboutContent} />);
    const section = screen.getByRole('region', {
      name: 'The sets of Candy Heist are acts of Remembrance.'
    });
    expect(
      within(section).getByRole('heading', { level: 2 })
    ).toHaveTextContent('The sets of Candy Heist are acts of Remembrance.');
  });

  it('lists every fact as a term and its value', () => {
    render(<AboutSection content={aboutContent} />);
    const terms = screen.getAllByRole('term').map((node) => node.textContent);
    expect(terms).toEqual(['Origin', 'Based in', 'Discipline', 'Established']);
    expect(screen.getByText('Kerala, India')).toBeInTheDocument();
  });

  it('shows the photo, the copy with its emphasis, and the CTA', () => {
    render(<AboutSection content={aboutContent} />);
    expect(screen.getByAltText(aboutContent.photo.alt)).toHaveAttribute(
      'src',
      aboutContent.photo.src
    );
    expect(screen.getByText('builds rooms that remember').tagName).toBe('EM');
    expect(
      screen.getByRole('link', { name: aboutContent.cta.label })
    ).toHaveAttribute('href', aboutContent.cta.href);
  });
});
