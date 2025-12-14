/**
 * Roy Tools - Now defined as step functions in workflows/chat.ts
 *
 * This file is kept for reference and any shared utilities.
 * All tool definitions have been moved to workflows/chat.ts
 * where they use "use step" for durability.
 */

export const toolsRequiringConfirmation = [
  "generatePrototype",
  "createDraftPR",
];
