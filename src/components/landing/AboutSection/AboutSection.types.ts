import type {
  AboutContent,
  AboutFact,
  AboutHeadlineHalf
} from '@/content/home/about';

export interface AboutSectionProps {
  content: AboutContent;
}

export type AboutSide = 'left' | 'right';

export interface AboutHeadlineProps {
  half: AboutHeadlineHalf;
  side: AboutSide;
}

export interface AboutFactsProps {
  facts: AboutFact[];
  side: AboutSide;
}

export interface AboutArchProps {
  photo: AboutContent['photo'];
}
