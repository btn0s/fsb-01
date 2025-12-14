"use client";

import { RoyPrompt } from "./roy-prompt";
import { RoyPanel } from "./roy-panel";
import { RoyWorkingBadge } from "./roy-working-badge";
import { RoyTrigger } from "./roy-trigger";

/**
 * Main Roy HUD container
 * Renders all Roy UI components in the correct order
 */
export function RoyHUD() {
  return (
    <>
      {/* Trigger button in corner when idle */}
      <RoyTrigger />

      {/* Spotlight prompt for input */}
      <RoyPrompt />

      {/* Slide-out panel for conversation */}
      <RoyPanel />

      {/* Working badge for background tasks */}
      <RoyWorkingBadge />
    </>
  );
}
