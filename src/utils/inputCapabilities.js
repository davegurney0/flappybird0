const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function matchesMediaQuery(query, matchMedia) {
  if (typeof matchMedia !== "function") {
    return false;
  }

  try {
    return Boolean(matchMedia(query)?.matches);
  } catch {
    return false;
  }
}

export function supportsDesktopHover(
  matchMedia =
    typeof globalThis.matchMedia === "function"
      ? globalThis.matchMedia.bind(globalThis)
      : undefined,
) {
  return matchesMediaQuery(HOVER_QUERY, matchMedia);
}

export function prefersReducedMotion(
  matchMedia =
    typeof globalThis.matchMedia === "function"
      ? globalThis.matchMedia.bind(globalThis)
      : undefined,
) {
  return matchesMediaQuery(REDUCED_MOTION_QUERY, matchMedia);
}
