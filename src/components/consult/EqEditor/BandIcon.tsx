import type { EqBandType } from '@/lib/consult/engine';

// Each kind of EQ point as the shape it makes: a cut's fall, a shelf's
// step, a bell's hill, a notch's dip, a band pass's peak. Drawn in the
// text's colour, so a picked one lights with its button.

const PATHS: Record<EqBandType, string> = {
  lowcut: 'M2 14C6 14 7 4 11 4H22',
  lowshelf: 'M2 4H7C10 4 11 9 14 9H22',
  bell: 'M2 10H6C9 10 9 3 12 3S15 10 18 10H22',
  notch: 'M2 5H9C10.5 5 11 14 12 14S13.5 5 15 5H22',
  bandpass: 'M2 14C7 14 9 4 12 4S17 14 22 14',
  highshelf: 'M2 9H10C13 9 14 4 17 4H22',
  highcut: 'M2 4H13C17 4 18 14 22 14'
};

export default function BandIcon({ type }: { type: EqBandType }) {
  return (
    <svg viewBox="0 0 24 18" width="24" height="18" aria-hidden="true">
      <path
        d={PATHS[type]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
