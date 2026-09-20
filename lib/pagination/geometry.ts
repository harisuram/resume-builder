import { PAGE_HEIGHT_PX as PAGE_HEIGHT } from "@/lib/page";

/** Y of `el` on the preview stage. Prefer the layout box so sidebar/split
 * tables (display:flex on screen, display:table in print) still report the
 * right page. jsdom has no layout, so tests that stub offsetTop keep working. */
export function offsetTopIn(el: HTMLElement, root: HTMLElement, scale = 1): number {
  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  if (rootRect.width > 1 && elRect.height > 1) {
    return (elRect.top - rootRect.top) / (scale || 1);
  }
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    top += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent || parent === node) break;
    node = parent;
  }
  return top;
}

/** Sidebar / asymmetric rails don't paginate as their own sheet. Pushing a
 * rail section with margin-top opens a hole in the colored column. */
export function inRailColumn(el: HTMLElement): boolean {
  return Boolean(el.closest("[data-resume-column='rail']"));
}

export function straddlesPage(top: number, height: number, pageHeight = PAGE_HEIGHT): boolean {
  if (height < 1) return false;
  const bottom = top + height;
  return Math.floor(top / pageHeight) !== Math.floor((bottom - 0.5) / pageHeight);
}
