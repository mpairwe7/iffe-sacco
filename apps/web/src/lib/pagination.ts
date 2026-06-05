/**
 * Returns the bounded window of page numbers to render for a paginator.
 *
 * At most `max` numbered buttons are returned regardless of how many pages
 * exist, sliding around the active page — so a 1,000-page list never renders
 * 1,000 buttons (which would overflow and break the layout). Shared by the
 * DataTable and the welfare events table so the windowing logic lives in one
 * place.
 *
 * Examples (max = 7):
 *   getPageWindow(1, 3)    -> [1, 2, 3]
 *   getPageWindow(1, 999)  -> [1, 2, 3, 4, 5, 6, 7]
 *   getPageWindow(50, 999) -> [47, 48, 49, 50, 51, 52, 53]
 *   getPageWindow(999, 999)-> [993, 994, 995, 996, 997, 998, 999]
 */
export function getPageWindow(active: number, total: number, max = 7): number[] {
  const totalPages = Math.max(1, total);
  const count = Math.min(max, totalPages);
  const half = Math.floor(max / 2);

  return Array.from({ length: count }, (_, i) => {
    if (totalPages <= max) return i + 1;
    if (active <= half + 1) return i + 1;
    if (active >= totalPages - half) return totalPages - max + 1 + i;
    return active - half + i;
  });
}
