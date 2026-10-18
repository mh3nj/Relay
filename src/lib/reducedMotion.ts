/**
 * The effective "prefers reduced motion" state, honoring the explicit
 * Settings > Accessibility override before falling back to the OS-level
 * media query.
 *
 * Mirrors the CSS in index.css: `html[data-reduced-motion="true"]`
 * force-disables animation regardless of the OS setting, and the
 * `@media (prefers-reduced-motion: reduce)` block is itself scoped with
 * `html:not([data-reduced-motion="false"])` so an explicit in-app "off"
 * choice can override an OS-level "reduce motion" preference. JS-driven
 * animation logic (anything not pure CSS) needs to replicate that same
 * precedence by hand. Reading `window.matchMedia` alone, as some
 * components used to, ignores the override entirely.
 */
export function prefersReducedMotion(): boolean {
  if (typeof document !== "undefined") {
    const override = document.documentElement.getAttribute("data-reduced-motion");
    if (override === "true") return true;
    if (override === "false") return false;
  }
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}
