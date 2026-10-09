// @vitest-environment node
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  encodeServicePhotos,
  InvalidPhotoError,
  isServicePhotoAddress,
  SERVICE_PHOTO_SIZES,
  storeServicePhotos
} from './servicePhotos';

// A service's photos as the site cuts and keeps them, with Supabase stood
// in for: nothing here reaches the network.

const upload = vi.fn();
const from = vi.fn();
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

const PROJECT = 'https://project.supabase.test';
const FOLDER = `${PROJECT}/storage/v1/object/public/covers-dev/services/`;

/** A noisy photo, like a real one rather than a flat colour. */
const photo = (width: number, height: number) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#6a3a1f',
      noise: { type: 'gaussian', mean: 128, sigma: 30 }
    }
  })
    .jpeg({ quality: 90 })
    .toBuffer();

const configure = () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', PROJECT);
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_x');
  vi.stubEnv('SUPABASE_COVERS_BUCKET', '');
};

beforeAll(() => {
  vi.mocked(createClient).mockReturnValue({
    storage: { from }
  } as unknown as ReturnType<typeof createClient>);
  from.mockReturnValue({
    upload,
    getPublicUrl: (path: string) => ({
      data: {
        publicUrl: `${PROJECT}/storage/v1/object/public/covers-dev/${path}`
      }
    })
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('a service’s photos as the site cuts them', () => {
  it('makes the card and the banner, each a WebP of its own shape', async () => {
    const { card, wide } = await encodeServicePhotos(await photo(2400, 1600));
    for (const [data, size] of [
      [card, SERVICE_PHOTO_SIZES.card],
      [wide, SERVICE_PHOTO_SIZES.wide]
    ] as const) {
      const meta = await sharp(data).metadata();
      expect(meta.format).toBe('webp');
      expect([meta.width, meta.height]).toEqual([size.width, size.height]);
      expect(data.length).toBeLessThan(1024 * 1024);
    }
  });

  it('measures a photo as it stands up, not as it was stored', async () => {
    // Stored 1000 × 1500 on its side: it stands 1500 wide.
    const sideways = await sharp(await photo(1000, 1500))
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    await expect(encodeServicePhotos(sideways)).resolves.toBeTruthy();
  });

  it('refuses what isn’t a photo, and one too small for the banner', async () => {
    await expect(
      encodeServicePhotos(Buffer.from('not an image'))
    ).rejects.toThrow(InvalidPhotoError);
    await expect(encodeServicePhotos(await photo(1000, 1500))).rejects.toThrow(
      'at least 1200 pixels wide and 800 tall; that one is 1000×1500'
    );
    const gif = await sharp({
      create: { width: 1600, height: 1000, channels: 3, background: '#000' }
    })
      .gif()
      .toBuffer();
    await expect(encodeServicePhotos(gif)).rejects.toThrow(
      'a PNG, a JPEG or a WebP'
    );
  });
});

describe('a service’s photos in storage', () => {
  it('keeps both beside the covers, in their own folder, named by their bytes', async () => {
    configure();
    upload.mockResolvedValue({ data: {}, error: null });
    const stored = await storeServicePhotos(await photo(2000, 1300));
    expect(from).toHaveBeenCalledWith('covers-dev');
    expect(stored.card).toMatch(
      new RegExp(`^${FOLDER}card-[0-9a-f]{16}\\.webp$`)
    );
    expect(stored.wide).toMatch(
      new RegExp(`^${FOLDER}wide-[0-9a-f]{16}\\.webp$`)
    );
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('lets a service show the site’s own photos and its stored ones, nothing else', () => {
    configure();
    expect(isServicePhotoAddress('/img/sessions/dj-wide.jpeg')).toBe(true);
    expect(isServicePhotoAddress(`${FOLDER}card-0123456789abcdef.webp`)).toBe(
      true
    );
    expect(isServicePhotoAddress('/img/../secret.jpeg')).toBe(false);
    expect(isServicePhotoAddress('https://elsewhere.test/photo.jpg')).toBe(
      false
    );
    expect(isServicePhotoAddress(`${FOLDER}../covers/x.webp`)).toBe(false);
    expect(isServicePhotoAddress(`${FOLDER}card-guess.webp`)).toBe(false);
  });

  it('takes only the site’s own photos while storage isn’t set up', () => {
    expect(isServicePhotoAddress('/img/sessions/dj-wide.jpeg')).toBe(true);
    expect(isServicePhotoAddress(`${FOLDER}card-0123456789abcdef.webp`)).toBe(
      false
    );
  });
});
