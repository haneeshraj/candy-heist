import { deleteFiledRoute, type FiledContext } from '@/lib/haven/filedRoutes';

// One DJ enquiry, for Candy Haven: DELETE removes it for good.

export function DELETE(request: Request, context: FiledContext) {
  return deleteFiledRoute('enquiry', request, context);
}
