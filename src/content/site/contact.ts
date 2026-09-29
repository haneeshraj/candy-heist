// How to reach Candy Heist, shared by the footer and the home Contact
// section so each detail lives in one place. Placeholders until the client
// confirms them: the phone number is a dummy (555-01xx numbers are reserved
// for fiction).

export interface SiteContact {
  email: string;
  phone: {
    /** As it reads on the page. */
    label: string;
    /** The tel: link, digits only. */
    href: string;
  };
}

export const siteContact: SiteContact = {
  email: 'booking@candyheist.com',
  phone: { label: '+1 (902) 555-0142', href: 'tel:+19025550142' }
};
