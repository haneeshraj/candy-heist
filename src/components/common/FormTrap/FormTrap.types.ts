import type { Ref } from 'react';
import type { FormCheck } from '@/lib/forms/spam';

export interface FormTrapHandle {
  /** What the server's spam checks need, read at the moment of sending. */
  check: () => FormCheck;
}

export interface FormTrapProps {
  ref?: Ref<FormTrapHandle>;
}
