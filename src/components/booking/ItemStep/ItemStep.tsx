'use client';

import { useRef } from 'react';
import { SigilChip } from '@/components/common/SigilChip';
import { ArrowBackIcon } from '@/components/icons';
import { useEntrance } from '@/hooks/useEntrance';
import ItemDetail from './ItemDetail';
import styles from './ItemStep.module.scss';
import type { ItemStepProps } from './ItemStep.types';

// Figma "Producer · 2 · Item": the way back to the services, then the
// chosen one's details across the page, with its one action beside its
// name. The service is picked from the list before this, so there's no
// list here.
export default function ItemStep({
  copy,
  kinds,
  item,
  price,
  onBack,
  onContinue
}: ItemStepProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  useEntrance(rootRef);

  return (
    <section ref={rootRef} className={styles.step}>
      <div className={styles.back} data-enter>
        <SigilChip variant="ghost" icon={<ArrowBackIcon />} onClick={onBack}>
          {copy.back}
        </SigilChip>
      </div>
      <ItemDetail
        key={item.id}
        copy={copy}
        kind={kinds[item.kind]}
        item={item}
        price={price}
        onContinue={onContinue}
      />
    </section>
  );
}
