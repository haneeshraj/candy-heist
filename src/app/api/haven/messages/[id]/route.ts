import {
  deleteFiledRoute,
  patchFiled,
  type FiledContext
} from '@/lib/haven/filedRoutes';
import { isMessageStatus } from '@/lib/inbox/status';

// One contact message, for Candy Haven: PATCH { status } moves it along,
// DELETE removes it for good.

export function PATCH(request: Request, context: FiledContext) {
  return patchFiled('message', isMessageStatus, request, context);
}

export function DELETE(request: Request, context: FiledContext) {
  return deleteFiledRoute('message', request, context);
}
