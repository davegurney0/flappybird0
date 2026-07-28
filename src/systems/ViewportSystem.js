const MOBILE_USER_AGENT_PATTERN =
  /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i;

export function isLikelyMobileDevice({
  mobileHint = false,
  userAgent = "",
  maxTouchPoints = 0,
} = {}) {
  const isIPadDesktopMode =
    /Macintosh/i.test(userAgent) && maxTouchPoints > 1;

  return (
    mobileHint ||
    MOBILE_USER_AGENT_PATTERN.test(userAgent) ||
    isIPadDesktopMode
  );
}

export function shouldShowOrientationWarning({
  isMobileDevice,
  viewportWidth,
  viewportHeight,
}) {
  return isMobileDevice && viewportWidth > viewportHeight;
}

function updateViewportState() {
  const viewportWidth =
    window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

  document.documentElement.style.setProperty(
    "--app-height",
    `${Math.round(viewportHeight)}px`,
  );

  const orientationWarning = document.querySelector(
    "#orientation-warning",
  );
  const showOrientationWarning = shouldShowOrientationWarning({
    isMobileDevice: isLikelyMobileDevice({
      mobileHint: navigator.userAgentData?.mobile ?? false,
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
    }),
    viewportWidth,
    viewportHeight,
  });

  if (orientationWarning) {
    orientationWarning.hidden = !showOrientationWarning;
    orientationWarning.setAttribute(
      "aria-hidden",
      String(!showOrientationWarning),
    );
  }
}

export function initViewportSystem() {
  updateViewportState();

  window.addEventListener("resize", updateViewportState, { passive: true });
  window.addEventListener("orientationchange", updateViewportState, {
    passive: true,
  });
  window.visualViewport?.addEventListener("resize", updateViewportState, {
    passive: true,
  });

  return () => {
    window.removeEventListener("resize", updateViewportState);
    window.removeEventListener("orientationchange", updateViewportState);
    window.visualViewport?.removeEventListener("resize", updateViewportState);
  };
}
