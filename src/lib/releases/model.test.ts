import { describe, expect, it } from 'vitest';
import {
  isVisible,
  releasePatchSchema,
  releaseSchema,
  shelfSchema,
  spotifyAlbumId,
  titleKey
} from './model';

const release = (patch: object = {}) => ({
  title: 'Menace',
  kind: 'single',
  status: 'released',
  artist: 'Candy Heist',
  date: '2025-03-14',
  subtitle: '',
  label: '',
  credits: [],
  tracks: [{ title: 'Menace', duration: '3:37', isrc: 'qzes82500001' }],
  distribution: [],
  upc: '',
  ...patch
});

describe('a release sent from Haven', () => {
  it('reads a whole release, dropping empty optional fields', () => {
    const parsed = releaseSchema.parse(release());
    expect(parsed.subtitle).toBeUndefined();
    expect(parsed.label).toBeUndefined();
    expect(parsed.tracks[0].isrc).toBe('QZES82500001');
  });

  it('needs a track, and exactly one for a single or a remix', () => {
    expect(releaseSchema.safeParse(release({ tracks: [] })).success).toBe(
      false
    );
    const two = [{ title: 'A' }, { title: 'B' }];
    expect(
      releaseSchema.safeParse(release({ kind: 'remix', tracks: two })).success
    ).toBe(false);
    expect(
      releaseSchema.safeParse(release({ kind: 'ep', tracks: two })).success
    ).toBe(true);
  });

  it('keeps a track that is still to be named', () => {
    const parsed = releaseSchema.parse(
      release({ kind: 'ep', tracks: [{ title: 'Menace' }, { title: '' }] })
    );
    expect(parsed.tracks[1].title).toBe('');
  });

  it('refuses a UPC or an ISRC that isn’t one', () => {
    expect(releaseSchema.safeParse(release({ upc: '12ab' })).success).toBe(
      false
    );
    expect(
      releaseSchema.safeParse(release({ tracks: [{ title: 'A', isrc: 'X1' }] }))
        .success
    ).toBe(false);
    expect(
      releaseSchema.safeParse(release({ upc: '199350000000' })).success
    ).toBe(true);
  });

  it('needs a link on every platform it lists', () => {
    const bare = { platform: 'spotify' };
    expect(
      releaseSchema.safeParse(release({ distribution: [bare] })).success
    ).toBe(false);
  });

  it('takes a change of any one field, and refuses an empty one', () => {
    expect(
      releasePatchSchema.safeParse({ title: 'Menace (VIP)' }).success
    ).toBe(true);
    expect(releasePatchSchema.safeParse({}).success).toBe(false);
  });
});

describe('recognising a release', () => {
  it('finds the Spotify album in its links', () => {
    expect(
      spotifyAlbumId([
        { platform: 'deezer', streamUrl: 'https://www.deezer.com/album/1' },
        {
          platform: 'spotify',
          streamUrl:
            'https://open.spotify.com/intl-de/album/4aawyAB9vmqN3uQ7FjRGTy?si=x'
        }
      ])
    ).toBe('4aawyAB9vmqN3uQ7FjRGTy');
    expect(
      spotifyAlbumId([
        { platform: 'spotify', streamUrl: 'https://open.spotify.com/track/1' }
      ])
    ).toBe('');
  });

  it('keys a title by its words and its kind', () => {
    expect(titleKey('Move Yo Body!', 'single')).toBe('move-yo-body|single');
    expect(titleKey('MOVE YO BODY', 'single')).toBe('move-yo-body|single');
    expect(titleKey('Move Yo Body!', 'ep')).not.toBe(
      titleKey('Move Yo Body!', 'single')
    );
  });
});

describe('who sees a release', () => {
  it('shows what’s out and hides what isn’t, unless switched', () => {
    expect(isVisible({ shown: null, status: 'released' })).toBe(true);
    expect(isVisible({ shown: null, status: 'scheduled' })).toBe(false);
    expect(isVisible({ shown: true, status: 'scheduled' })).toBe(true);
    expect(isVisible({ shown: false, status: 'released' })).toBe(false);
  });

  it('holds up to eight on the shelf, each once', () => {
    const id = (n: number) => n.toString(16).padStart(24, '0');
    expect(
      shelfSchema.safeParse({ ids: [1, 2, 3, 4, 5, 6, 7, 8].map(id) }).success
    ).toBe(true);
    expect(
      shelfSchema.safeParse({ ids: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(id) })
        .success
    ).toBe(false);
    expect(shelfSchema.safeParse({ ids: [id(1), id(1)] }).success).toBe(false);
  });
});
