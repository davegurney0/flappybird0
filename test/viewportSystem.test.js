import assert from "node:assert/strict";
import test from "node:test";
import {
  isLikelyMobileDevice,
  shouldShowOrientationWarning,
} from "../src/systems/ViewportSystem.js";

test("a Windows desktop never receives the mobile orientation warning", () => {
  const isMobileDevice = isLikelyMobileDevice({
    mobileHint: false,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    maxTouchPoints: 0,
  });

  assert.equal(isMobileDevice, false);
  assert.equal(
    shouldShowOrientationWarning({
      isMobileDevice,
      viewportWidth: 1440,
      viewportHeight: 900,
    }),
    false,
  );
});

test("a landscape Android phone receives the orientation warning", () => {
  const isMobileDevice = isLikelyMobileDevice({
    mobileHint: true,
    userAgent: "Mozilla/5.0 (Linux; Android 16; Pixel 10)",
    maxTouchPoints: 5,
  });

  assert.equal(
    shouldShowOrientationWarning({
      isMobileDevice,
      viewportWidth: 844,
      viewportHeight: 390,
    }),
    true,
  );
});

test("a portrait phone never receives the orientation warning", () => {
  assert.equal(
    shouldShowOrientationWarning({
      isMobileDevice: true,
      viewportWidth: 390,
      viewportHeight: 844,
    }),
    false,
  );
});
