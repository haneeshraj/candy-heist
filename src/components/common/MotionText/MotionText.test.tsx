import { render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LetterUp, WordBlockReveal, WordUp } from '.';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

describe('LetterUp', () => {
  it('reads as one phrase, with the letters hidden from assistive tech', () => {
    render(<LetterUp as="h2" text="Menu" />);
    expect(screen.getByRole('heading', { name: 'Menu' })).toBeInTheDocument();
    const letters = screen.getByText('M', { selector: 'span' });
    expect(letters.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('keeps the letters of each word together', () => {
    const { container } = render(<LetterUp text="Book now" />);
    const words = container.querySelectorAll('[aria-hidden="true"] > span');
    expect([...words].map((w) => w.textContent)).toEqual(['Book', ' ', 'now']);
  });
});

describe('WordUp', () => {
  it('splits the text into words, read once as a whole', () => {
    const { container } = render(
      <WordUp as="p" text="Designed & developed by Haneesh Raj" />
    );
    expect(
      screen.getByText('Designed & developed by Haneesh Raj')
    ).toBeInTheDocument();
    const words = container.querySelectorAll('[aria-hidden="true"] > span');
    expect([...words].map((w) => w.textContent)).toEqual([
      'Designed',
      '&',
      'developed',
      'by',
      'Haneesh',
      'Raj'
    ]);
  });
});

describe('WordBlockReveal', () => {
  it('reveals the text behind a coloured block', () => {
    const { container } = render(
      <WordBlockReveal text="Sessions" blockColor="red" />
    );
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    const block = container.querySelector<HTMLElement>(
      '[aria-hidden="true"][style*="background-color"]'
    );
    expect(block?.style.backgroundColor).toBe('red');
  });
});
