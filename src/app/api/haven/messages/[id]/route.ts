import { deleteFiledRoute, type FiledContext } from '@/lib/haven/filedRoutes';

// One contact message, for Candy Haven: DELETE removes it for good.

export function DELETE(request: Request, context: FiledContext) {
  return deleteFiledRoute('message', request, context);
}
