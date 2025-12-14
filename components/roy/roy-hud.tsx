"use client";

import { RoyPrompt } from "./roy-prompt";

/**
 * Main Roy HUD container
 * All conversation happens in the floating prompt
 */
export function RoyHUD() {
  return (
    <>
      {/* Self-contained floating prompt with chat */}
      <RoyPrompt />
    </>
  );
}

