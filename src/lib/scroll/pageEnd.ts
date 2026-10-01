// Whether the page is resting at its end, the footer still under it: set
// by the footer (SiteFooter's useFooterAtEnd), read by the scroll hint.

let atEnd = false;
const listeners = new Set<() => void>();

export function setAtPageEnd(value: boolean) {
  if (value === atEnd) return;
  atEnd = value;
  listeners.forEach((listener) => listener());
}

export function subscribeAtPageEnd(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getAtPageEnd = () => atEnd;
