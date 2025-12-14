"use client";

import { RoyPrompt } from "./roy-prompt";
import { RoyWorkingBadge } from "./roy-working-badge";

/**
 * Main Roy HUD container
 * All conversation happens in the floating prompt
 */
export function RoyHUD() {
  return (
    <>
      {/* Self-contained floating prompt with chat */}
      <RoyPrompt />

      {/* Working badge for background tasks (when prompt is collapsed) */}
      <RoyWorkingBadge />
    </>
  );
}

