import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteNavbar } from '@/components/layout/SiteNavbar';
import { footerContent } from '@/content/site/footer';
import { navbarContent } from '@/content/site/navbar';
import styles from './layout.module.scss';

// Every page of the site: the navbar over it, the footer after it.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.site}>
      <SiteNavbar content={navbarContent} />
      <div className={styles.content}>{children}</div>
      <SiteFooter content={footerContent} />
    </div>
  );
}
