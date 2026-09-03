export function parsePage(page?: number, pageSize?: number) {
  const safePage = page && page > 0 ? page : 1;
  const safeSize = pageSize && pageSize > 0 ? Math.min(pageSize, 100) : 20;
  return {
    page: safePage,
    pageSize: safeSize,
    skip: (safePage - 1) * safeSize,
    take: safeSize,
  };
}
