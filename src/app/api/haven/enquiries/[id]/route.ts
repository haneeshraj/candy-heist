import {
  deleteFiledRoute,
  patchFiled,
  type FiledContext
} from '@/lib/haven/filedRoutes';
import { isEnquiryStatus } from '@/lib/inbox/status';

// One DJ enquiry, for Candy Haven: PATCH { status } moves it along,
// DELETE removes it for good.

export function PATCH(request: Request, context: FiledContext) {
  return patchFiled('enquiry', isEnquiryStatus, request, context);
}

export function DELETE(request: Request, context: FiledContext) {
  return deleteFiledRoute('enquiry', request, context);
}
