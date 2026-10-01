// The link previews' two designs, at 1200 × 630, in the renderer's subset
// of CSS (flexbox, inline styles, no inset shorthand): the site's own
// card, and a release's.

export const OG_SIZE = { width: 1200, height: 630 };

const OBSIDIAN = '#0c0c0c';
const CREAM = '#ddcfb2';
const GOLD = '#b69e7c';
const GILT = '#d2a961';
const CONCRETE = '#8a8071';

const mono = (size: number, color = GILT) => ({
  fontFamily: 'Plex Mono',
  fontSize: size,
  letterSpacing: '0.4em',
  textTransform: 'uppercase' as const,
  color
});

function Mark({
  path,
  width,
  color = GILT
}: {
  path: string;
  width: number;
  color?: string;
}) {
  return (
    <svg
      width={width}
      height={(width * 298.37) / 414.64}
      viewBox="0 0 414.64 298.37"
    >
      <path d={path} fill={color} />
    </svg>
  );
}

export interface SiteCardData {
  photo: string;
  mark: string;
  /** "The sets of", over the name. */
  lead: string;
  statement: string;
  /** Under the name: "are acts of remembrance". */
  line: string;
  foot: string;
}

/** The site's card: the name over the stage photo, under the vortex. */
export function SiteCard({
  photo,
  mark,
  lead,
  statement,
  line,
  foot
}: SiteCardData) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: OBSIDIAN,
        position: 'relative'
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        src={photo}
        width={1200}
        height={630}
        style={{ position: 'absolute', left: 0, top: 0, objectFit: 'cover' }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          display: 'flex',
          background: `linear-gradient(90deg, ${OBSIDIAN} 14%, rgba(12,12,12,0.78) 38%, rgba(12,12,12,0.25) 66%, rgba(12,12,12,0) 100%)`
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          width: '100%',
          position: 'relative'
        }}
      >
        <Mark path={mark} width={96} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'Cormorant',
              fontStyle: 'italic',
              fontSize: 44,
              color: GOLD
            }}
          >
            {lead}
          </div>
          <div
            style={{
              fontFamily: 'Archivo',
              fontSize: 112,
              letterSpacing: '0.06em',
              color: CREAM,
              lineHeight: 1,
              marginTop: 8
            }}
          >
            {statement.toUpperCase()}
          </div>
          <div style={{ display: 'flex', ...mono(20), marginTop: 28 }}>
            {line}
          </div>
        </div>
        <div style={{ display: 'flex', ...mono(16, CONCRETE) }}>{foot}</div>
      </div>
    </div>
  );
}

export interface ReleaseCardData {
  cover: string;
  mark: string;
  /** "EP · 2024", "Out 12 December 2026". */
  meta: string;
  title: string;
  artist: string;
  /** For a track: "From The Halls". */
  from?: string;
  /** "Listen now" or "Pre-save". */
  action: string;
}

/** A release's card: its cover, what it is, and the way in. */
export function ReleaseCard({
  cover,
  mark,
  meta,
  title,
  artist,
  from,
  action
}: ReleaseCardData) {
  const long = title.length > 18;
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: OBSIDIAN,
        padding: 72,
        alignItems: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          border: '1px solid rgba(210,169,97,0.45)',
          padding: 10
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={cover} width={466} height={466} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: 486,
          marginLeft: 64,
          flex: 1
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', ...mono(18) }}>{meta}</div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Archivo',
              fontSize: long ? 60 : 80,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: CREAM,
              lineHeight: 1.02,
              marginTop: 28
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Cormorant',
              fontStyle: 'italic',
              fontSize: 40,
              color: GOLD,
              marginTop: 16
            }}
          >
            {artist}
          </div>
          {from ? (
            <div
              style={{ display: 'flex', ...mono(16, CONCRETE), marginTop: 20 }}
            >
              {from}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              display: 'flex',
              background: GILT,
              padding: '16px 26px 16px 32px',
              ...mono(18, OBSIDIAN)
            }}
          >
            {action}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Mark path={mark} width={48} />
            <div style={{ display: 'flex', ...mono(16, GOLD) }}>
              Candy Heist
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
