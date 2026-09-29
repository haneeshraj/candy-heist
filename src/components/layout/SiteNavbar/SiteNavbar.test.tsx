import type { MouseEvent, ReactNode } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionGlobalConfig } from 'motion/react';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';
import { navbarContent } from '@/content/site/navbar';
import SiteNavbar from './SiteNavbar';

const { lenis, pathname } = vi.hoisted(() => ({
  lenis: { stop: vi.fn(), start: vi.fn() },
  pathname: { current: '/' }
}));

vi.mock('lenis/react', () => ({ useLenis: () => lenis }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));
// Client-side routing, without jsdom trying to load the page.
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    >
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

beforeEach(() => {
  pathname.current = '/';
  lenis.stop.mockClear();
  lenis.start.mockClear();
});

function renderNavbar() {
  const user = userEvent.setup();
  const view = render(<SiteNavbar content={navbarContent} />);
  const toggle = screen.getByRole('button', { expanded: false });
  return { user, toggle, ...view };
}

const menu = () => screen.queryByRole('navigation', { name: 'Menu' });

describe('SiteNavbar', () => {
  it('names the toggle after the page you are on', () => {
    const { toggle } = renderNavbar();
    expect(toggle).toHaveAccessibleName('Open menu (Home)');
    expect(menu()).not.toBeInTheDocument();
  });

  it('opens the menu with every page, marking the current one', async () => {
    const { user, toggle } = renderNavbar();
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Close menu');
    const nav = menu()!;
    expect(toggle).toHaveAttribute('aria-controls', nav.id);

    const pages = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/'));
    expect(pages.map((link) => link.getAttribute('href'))).toEqual([
      ...navbarContent.links.map((link) => link.href),
      navbarContent.cta.href
    ]);
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(
      within(nav).getByRole('link', { name: 'About' })
    ).not.toHaveAttribute('aria-current');
  });

  it('opens the social links in a new tab and says so', async () => {
    const { user, toggle } = renderNavbar();
    await user.click(toggle);
    const list = within(menu()!).getByRole('list', {
      name: navbarContent.socialsLabel
    });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(navbarContent.socials.length);
    for (const [i, link] of links.entries()) {
      expect(link).toHaveAccessibleName(
        `${navbarContent.socials[i].label} (opens in a new tab)`
      );
      expect(link).toHaveAttribute('target', '_blank');
    }
  });

  it('holds the page still while open', async () => {
    const { user, toggle } = renderNavbar();
    await user.click(toggle);
    expect(lenis.stop).toHaveBeenCalledTimes(1);
    await user.click(toggle);
    expect(lenis.start).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and hands focus back to the toggle', async () => {
    const { user, toggle } = renderNavbar();
    await user.click(toggle);
    await user.tab();
    expect(within(menu()!).getByRole('link', { name: 'Home' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
  });

  it('keeps Tab inside the toggle and the menu', async () => {
    const { user, toggle } = renderNavbar();
    await user.click(toggle);
    const cta = within(menu()!).getByRole('link', {
      name: navbarContent.cta.label
    });

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(cta).toHaveFocus();
    await user.tab();
    expect(toggle).toHaveFocus();
  });

  it('closes when a link in the menu is followed', async () => {
    const { user, toggle } = renderNavbar();
    await user.click(toggle);
    await user.click(within(menu()!).getByRole('link', { name: 'About' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when the page changes, and follows it', async () => {
    const { user, toggle, rerender } = renderNavbar();
    await user.click(toggle);

    pathname.current = '/sessions';
    act(() => rerender(<SiteNavbar content={navbarContent} />));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName('Open menu (Sessions)');
  });

  it('falls back to a plain name on pages outside the menu', () => {
    pathname.current = '/somewhere-else';
    const { toggle } = renderNavbar();
    expect(toggle).toHaveAccessibleName('Open menu');
  });
});
