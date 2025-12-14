import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { ModelMessage, UIMessageChunk } from "ai";
import { z } from "zod";
import { ROY_SYSTEM_PROMPT } from "@/lib/roy/system-prompt";

// === CONTEXT ===
async function contextStep(query: string) {
  "use step";
  const { searchContent, getContentByType } = await import("@/lib/roy/content");

  const searchResults = searchContent(query, 5);
  const tasks = getContentByType("task");
  const okrs = getContentByType("okr");

  return {
    search: searchResults.map((r) => ({
      type: r.file.type,
      title: r.file.title || r.file.filename,
      snippet: r.snippet,
    })),
    tasks: tasks.map((t) => ({ title: t.title || t.filename })),
    okrs: okrs.map((o) => ({ title: o.title || o.filename })),
  };
}

// === WORKFLOW ===
async function workflowStep(
  type: "design" | "engineering",
  task: string,
  options?: { requirements?: string; files?: string[] }
) {
  "use step";
  const { start } = await import("workflow/api");

  if (type === "design") {
    const { designWorkflow } = await import("@/workflows/design");
    const run = await start(designWorkflow, [
      { task, requirements: options?.requirements },
    ]);
    return { workflowId: run.runId, type: "design" };
  }

  const { engineeringWorkflow } = await import("@/workflows/engineering");
  const run = await start(engineeringWorkflow, [
    { task, targetFiles: options?.files },
  ]);
  return { workflowId: run.runId, type: "engineering" };
}

async function statusStep(workflowId: string) {
  "use step";
  const { getRun } = await import("workflow/api");
  const run = await getRun(workflowId);
  return { status: run.status, result: run.returnValue };
}

// === TOOLS (DurableAgent format with inputSchema) ===
const tools = {
  context: {
    description:
      "Search and retrieve relevant context from OKRs, PRDs, tasks, transcripts, and decisions.",
    inputSchema: z.object({
      query: z.string().describe("What to search for"),
    }),
    execute: async ({ query }: { query: string }) => contextStep(query),
  },
  workflow: {
    description:
      "Start a long-running workflow. Use 'design' for UI prototypes, 'engineering' for code/PRs.",
    inputSchema: z.object({
      type: z.enum(["design", "engineering"]),
      task: z.string().describe("What to build"),
      requirements: z
        .string()
        .optional()
        .describe("For design: specific requirements"),
      files: z
        .array(z.string())
        .optional()
        .describe("For engineering: files to modify"),
    }),
    execute: async ({
      type,
      task,
      requirements,
      files,
    }: {
      type: "design" | "engineering";
      task: string;
      requirements?: string;
      files?: string[];
    }) => workflowStep(type, task, { requirements, files }),
  },
  status: {
    description: "Check the status of a running workflow.",
    inputSchema: z.object({
      workflowId: z.string(),
    }),
    execute: async ({ workflowId }: { workflowId: string }) =>
      statusStep(workflowId),
  },
};

export async function royChatWorkflow(messages: ModelMessage[]) {
  "use workflow";

  const writable = getWritable<UIMessageChunk>();

  const agent = new DurableAgent({
    model: "openai/gpt-4o",
    system: ROY_SYSTEM_PROMPT,
    tools,
  });

  await agent.stream({
    messages,
    writable,
  });
}
