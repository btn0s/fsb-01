import { tool } from "ai";
import { z } from "zod";
// #region agent log
import { start } from "workflow/api";
// #endregion
import { searchContent, getContentByType, loadAllContent } from "./content";
// Note: Workflows are imported in app/api/chat/route.ts to ensure plugin processes them
// We'll import them dynamically or pass them as parameters

// #region agent log
const LOG_ENDPOINT = 'http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0';
const log = (location: string, message: string, data: any, hypothesisId: string) => {
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      hypothesisId
    })
  }).catch(() => {});
};
// #endregion

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
 * === WORKFLOW TRIGGERS (async, run in background) ===
 * 
 * NOTE: Workflow trigger tools are now defined in app/api/chat/route.ts
 * where the workflow functions are imported. This ensures the workflow
 * plugin processes them correctly.
 */

/**
 * Check the status of a running workflow
 */
export const checkWorkflowStatus = tool({
  description: "Check the status of a running workflow",
  inputSchema: z.object({ workflowId: z.string() }),
  execute: async ({ workflowId }) => {
    const baseUrl =
      process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "";
    const protocol = baseUrl.startsWith("http") ? "" : "https://";
    const url = `${protocol}${baseUrl}/api/workflow/${workflowId}/status`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        error: `Failed to fetch workflow status: ${res.statusText}`,
      };
    }
    return res.json();
  },
});

/**
 * All Roy tools (excluding workflow triggers - those are created in app/api/chat/route.ts)
 */
export const royTools = {
  // === INLINE TOOLS (fast, run in request) ===
  searchContext,
  getTaskList,
  getOKRs,
  webSearch,
  // === WORKFLOW STATUS CHECK ===
  checkWorkflowStatus,
};

/**
 * Tools that require human confirmation (no execute function)
 */
export const toolsRequiringConfirmation = [
  "generatePrototype",
  "createDraftPR",
];

