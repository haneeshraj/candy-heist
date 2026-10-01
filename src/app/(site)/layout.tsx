import type { ReactNode } from 'react';
import { ScrollHint } from '@/components/layout/ScrollHint';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteNavbar } from '@/components/layout/SiteNavbar';
import { footerContent } from '@/content/site/footer';
import { navbarContent } from '@/content/site/navbar';
import styles from './layout.module.scss';

// Every page of the site: the navbar over it, the footer after it, and
// the hint that there's more below when a page rests at its end.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.site}>
      <SiteNavbar content={navbarContent} />
      <div className={styles.content}>{children}</div>
      <SiteFooter content={footerContent} />
      <ScrollHint />
    </div>
  );
}
