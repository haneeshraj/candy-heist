// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPublishedServices } from '@/lib/services/published';
import { publishedHoursOf } from '@/lib/services/model';
import { catalogue, fileServices } from './catalogue';
import { getServices } from './getServices';
import { fileHours } from './hours';

// What the producer page, the home page and the booking offer: the site's
// own files until Candy Haven publishes, then Haven's alone.

vi.mock('@/lib/services/published', () => ({
  readPublishedServices: vi.fn()
}));

const mixing = fileServices.find((item) => item.id === 'mixing')!;
const haven = {
  ...publishedHoursOf(fileHours),
  timeZone: 'Europe/London',
  bufferMinutes: 30
};

afterEach(() => vi.clearAllMocks());

describe('getServices', () => {
  it('offers the site’s own list and hours until Haven has published', async () => {
    vi.mocked(readPublishedServices).mockResolvedValue(null);
    const services = await getServices();
    expect(services.items).toBe(catalogue);
    expect(services.hours).toBe(fileHours);
  });

  it('offers only what Haven published, in its order, with its hours', async () => {
    vi.mocked(readPublishedServices).mockResolvedValue({
      items: [
        { ...mixing, id: 'stem-mixing', name: 'Stem Mixing', price: 150 },
        { ...mixing, body: 'Just *this*.' }
      ],
      hours: haven
    });
    const services = await getServices();
    expect(services.items.map((item) => [item.id, item.price])).toEqual([
      ['stem-mixing', 150],
      ['mixing', undefined]
    ]);
    expect(services.items[1].blocks).toEqual([
      {
        kind: 'paragraph',
        runs: [
          { text: 'Just ' },
          { text: 'this', voice: 'emphasis' },
          { text: '.' }
        ]
      }
    ]);
    // Candy's hours, with the site's own hold while someone pays.
    expect(services.hours).toEqual({
      ...haven,
      holdMinutes: fileHours.holdMinutes
    });
  });

  it('leaves out a service it can’t read, rather than the page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(readPublishedServices).mockResolvedValue({
      items: [
        { ...mixing, id: 'good' },
        { ...mixing, id: 'bad', body: '| a | b |\n|---|---|\n| 1 | 2 |' }
      ],
      hours: haven
    });
    expect((await getServices()).items.map((item) => item.id)).toEqual([
      'good'
    ]);
  });
});
