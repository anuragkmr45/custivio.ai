export function getPageCount(total: number, pageSize: number) {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page: number, total: number, pageSize: number) {
  const pageCount = getPageCount(total, pageSize);
  if (!Number.isFinite(page)) return 0;
  return Math.min(Math.max(0, Math.trunc(page)), pageCount - 1);
}

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  if (pageSize <= 0) return rows;
  const safePage = clampPage(page, rows.length, pageSize);
  const start = safePage * pageSize;
  return rows.slice(start, start + pageSize);
}

export function formatPaginationRange(total: number, page: number, pageSize: number) {
  if (total === 0) return "0 records";
  const safePage = clampPage(page, total, pageSize);
  const first = safePage * pageSize + 1;
  const last = Math.min(first + pageSize - 1, total);
  return `${first}-${last} of ${total}`;
}
