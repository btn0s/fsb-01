import { tool } from "ai";
import { z } from "zod";
import { searchContent, getContentByType, loadAllContent } from "./content";

/**
 * Search across all context files (OKRs, PRDs, transcripts, etc.)
 */
export const searchContext = tool({
  description:
    "Search the user's OKRs, PRDs, meeting transcripts, decisions, and task lists for relevant context. Use this to ground your responses in what the user and their team already know.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query - use keywords relevant to the topic"),
  }),
  execute: async ({ query }) => {
    const results = searchContent(query, 5);

    if (results.length === 0) {
      return {
        found: false,
        message: "No relevant context found for this query.",
        results: [],
      };
    }

    return {
      found: true,
      results: results.map((r) => ({
        type: r.file.type,
        title: r.file.title || r.file.filename,
        path: r.file.path,
        snippet: r.snippet,
        relevance: r.relevance,
      })),
    };
  },
});

/**
 * Get the current task list
 */
export const getTaskList = tool({
  description: "Get the current sprint tasks, priorities, and blockers",
  inputSchema: z.object({}).describe("No input parameters required"),
  execute: async () => {
    const tasks = getContentByType("task");

    if (tasks.length === 0) {
      return {
        found: false,
        message: "No task list found.",
      };
    }

    return {
      found: true,
      tasks: tasks.map((t) => ({
        title: t.title || t.filename,
        content: t.content,
      })),
    };
  },
});

/**
 * Get all OKRs
 */
export const getOKRs = tool({
  description: "Get the team's current OKRs and objectives",
  inputSchema: z.object({}).describe("No input parameters required"),
  execute: async () => {
    const okrs = getContentByType("okr");

    if (okrs.length === 0) {
      return {
        found: false,
        message: "No OKRs found.",
      };
    }

    return {
      found: true,
      okrs: okrs.map((o) => ({
        title: o.title || o.filename,
        content: o.content,
      })),
    };
  },
});

/**
 * Web search for current information
 * Note: In production, this would call a real search API (Tavily, Serper, etc.)
 */
export const webSearch = tool({
  description:
    "Search the web for current information, market data, news, or trends. Use this for information that wouldn't be in the user's local context.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    // Mock implementation - in production, call actual search API
    // For demo, return a plausible response
    return {
      query,
      results: [
        {
          title: `Search results for: ${query}`,
          snippet:
            "This is a mock web search result. In production, this would return real search results from Tavily, Serper, or similar.",
          url: "https://example.com",
        },
      ],
      note: "Web search is mocked for demo. Integrate with Tavily/Serper for production.",
    };
  },
});

/**
 * Generate prototypes using V0
 * This is a HITL tool - requires confirmation before execution
 */
export const generatePrototype = tool({
  description:
    "Generate UI prototypes using V0. Creates 2-3 visual variants based on a description. Use this when the user wants to see design options.",
  inputSchema: z.object({
    description: z
      .string()
      .describe("What to prototype - be specific about the UI/UX requirements"),
    context: z
      .string()
      .optional()
      .describe("Additional context from OKRs, PRDs, or discussions"),
    variants: z
      .number()
      .default(3)
      .describe("Number of variants to generate (default: 3)"),
  }),
  // No execute function = requires human confirmation
});

/**
 * Create a draft PR
 * This is a HITL tool - requires confirmation before execution
 */
export const createDraftPR = tool({
  description:
    "Create a draft pull request with generated code. Use this when the user has selected an approach and wants to move to implementation.",
  inputSchema: z.object({
    title: z.string().describe("PR title"),
    description: z.string().describe("PR description summarizing the changes"),
    files: z
      .array(
        z.object({
          path: z.string(),
          content: z.string(),
        })
      )
      .optional()
      .describe("Files to include in the PR"),
    reviewers: z
      .array(z.string())
      .optional()
      .describe("GitHub usernames to request review from"),
  }),
  // No execute function = requires human confirmation
});

/**
 * All Roy tools
 */
export const royTools = {
  searchContext,
  getTaskList,
  getOKRs,
  webSearch,
  generatePrototype,
  createDraftPR,
};

/**
 * Tools that require human confirmation (no execute function)
 */
export const toolsRequiringConfirmation = [
  "generatePrototype",
  "createDraftPR",
];

