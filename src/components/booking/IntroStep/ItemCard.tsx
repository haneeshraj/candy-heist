import Image from 'next/image';
import type { MouseEvent } from 'react';
import { Frame } from '@/components/common/Frame';
import { ArrowIcon } from '@/components/icons';
import styles from './IntroStep.module.scss';
import type { ItemCardProps } from './IntroStep.types';

// One item as a card that opens its details (Figma "Item card"): the photo,
// the name and its line, then the price and the way in. It's a real link,
// so it opens in a new tab like one; a plain click stays in the flow. On
// hover it lifts, the photo pushes in and the way in brightens.
export default function ItemCard({
  item,
  href,
  price,
  view,
  onOpen
}: ItemCardProps) {
  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    onOpen(item.id);
  }

  return (
    <a className={styles.card} href={href} onClick={open} data-reveal>
      <span className={styles.cardPhoto}>
        <Frame travel={40}>
          <Image
            src={item.photos.card}
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
            className={styles.cardImage}
          />
        </Frame>
      </span>
      <span className={styles.cardBody}>
        {/* The spaces keep the parts apart in the link's name. */}
        <span className={styles.cardName}>{item.name}</span>{' '}
        <span className={styles.cardLine}>{item.summary}</span>{' '}
        <span className={styles.cardFoot}>
          <span className={styles.cardPrice}>{price}</span>{' '}
          <span className={styles.cardView}>
            {view}
            <ArrowIcon className={styles.cardArrow} />
          </span>
        </span>
      </span>
    </a>
  );
}
