/** Sidebar / asymmetric surfaces: two columns that share one page stack.
 * Auto-nudging main-column cards with pixel spacers leaves huge blank bands
 * on page 1 (flex vs table measurement drift) and looks like "all projects
 * jumped." These layouts get offer-only pagination for cards; the rail is
 * painted by CSS for every sheet. */
export function isMultiColumnSurface(stage: HTMLElement): boolean {
  return Boolean(
    stage.querySelector(".resume-sidebar-page, .resume-split-page, [data-layout='sidebar'], [data-layout='asymmetric']"),
  );
}
