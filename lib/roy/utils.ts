import type { UIMessage } from "ai";

/**
 * Approval responses for HITL tools
 */
export const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const;

/**
 * Check if a tool requires confirmation
 */
export function requiresConfirmation(toolName: string): boolean {
  const hitlTools = ["generatePrototype", "createDraftPR"];
  return hitlTools.includes(toolName);
}

/**
 * Format search results for display
 */
export function formatSearchResults(
  results: Array<{
    type: string;
    title: string;
    snippet: string;
    relevance: number;
  }>
): string {
  return results
    .map(
      (r, i) =>
        `${i + 1}. [${r.type.toUpperCase()}] ${r.title}\n   ${r.snippet}`
    )
    .join("\n\n");
}

/**
 * Extract text content from a message
 */
export function getMessageText(message: UIMessage): string {
  if (!message.parts) return "";

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join(" ");
}

/**
 * Check if a message has pending tool confirmations
 */
export function hasPendingConfirmation(message: UIMessage): boolean {
  if (!message.parts) return false;

  return message.parts.some(
    (part) =>
      part.type.startsWith("tool-") &&
      "state" in part &&
      part.state === "approval-requested"
  );
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

