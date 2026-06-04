/**
 * Join truthy class names. Intentionally dependency-free for Phase 0; Phase 1
 * may swap this for clsx + tailwind-merge once the component library lands.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
