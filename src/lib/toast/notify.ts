import { toast } from 'sonner';

// The site's toasts (Figma "Toast"), through sonner: a success for a
// moment's good news, an error for what failed. Errors stay longer; both
// hold while the pointer is on them.

export const TOAST_DURATION = 4000;
export const ERROR_DURATION = 6000;

/** Something done: "Copied booking@candyheist.com", "Link copied". */
export function notifySuccess(title: string, description?: string) {
  return toast.success(title, { description });
}

/** Something that failed, what to do, and optionally a way to retry. */
export function notifyError(
  title: string,
  description?: string,
  retry?: { label: string; onClick: () => void }
) {
  return toast.error(title, {
    description,
    duration: ERROR_DURATION,
    action: retry
  });
}
