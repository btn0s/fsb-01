import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { tool } from "ai";
import { z } from "zod";
import { start } from "workflow/api";
import { ROY_SYSTEM_PROMPT } from "@/lib/roy/system-prompt";
// Import workflows directly to ensure they're processed by the workflow plugin
import { designWorkflow } from "@/workflows/design";
import { engineeringWorkflow } from "@/workflows/engineering";
import { royTools as baseRoyTools } from "@/lib/roy/tools";

// #region agent log
const LOG_ENDPOINT =
  "http://127.0.0.1:7243/ingest/cf8f535a-4cc4-4cfa-9d60-0b32784335f0";
const log = (
  location: string,
  message: string,
  data: any,
  hypothesisId: string
) => {
  fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId,
    }),
  }).catch(() => {});
};
// #endregion

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Create workflow trigger tools here where workflows are imported
// This ensures the workflow plugin processes them correctly
const startDesignTask = tool({
  description:
    "Start a design task - generates UI prototypes with V0. Use when user wants mockups, prototypes, or UI exploration.",
  inputSchema: z.object({
    task: z.string().describe("What to design"),
    requirements: z
      .string()
      .optional()
      .describe("Any specific requirements or constraints"),
  }),
  execute: async ({ task, requirements }) => {
    // #region agent log
    log(
      "app/api/chat/route.ts:26",
      "startDesignTask entry",
      { task, requirements },
      "A"
    );
    // #endregion

    try {
      // #region agent log
      log(
        "app/api/chat/route.ts:30",
        "Before start() call",
        {
          workflowType: typeof designWorkflow,
          workflowName: designWorkflow?.name,
          hasStart: typeof start !== "undefined",
          workflowToString: String(designWorkflow).substring(0, 200),
          workflowKeys: designWorkflow ? Object.keys(designWorkflow) : [],
          workflowMetadata: (designWorkflow as any)?.[Symbol.for("workflow")],
          workflowFile: (designWorkflow as any)?.__workflowFile,
          workflowId: (designWorkflow as any)?.__workflowId,
        },
        "B"
      );
      // #endregion

      const run = await start(designWorkflow, [
        {
          task,
          requirements,
        },
      ]);

      // #region agent log
      log(
        "app/api/chat/route.ts:45",
        "After start() call",
        {
          runType: typeof run,
          runKeys: run ? Object.keys(run) : null,
          hasRunId: run ? "runId" in run : false,
          runId: run?.runId,
          runStatus: run?.status,
        },
        "D"
      );
      // #endregion

      const result = {
        workflowId: run.runId,
        message: "Design task started. I'll let you know when it's ready.",
      };

      // #region agent log
      log("app/api/chat/route.ts:56", "startDesignTask success", result, "A");
      // #endregion

      return result;
    } catch (error) {
      // #region agent log
      log(
        "app/api/chat/route.ts:61",
        "startDesignTask error",
        {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorType: error?.constructor?.name,
        },
        "E"
      );
      // #endregion
      throw error;
    }
  },
});

const startEngineeringTask = tool({
  description:
    "Start an engineering task - generates code and creates a PR. Use when user wants code changes or implementations.",
  inputSchema: z.object({
    task: z.string().describe("What to build"),
    files: z.array(z.string()).optional().describe("Specific files to modify"),
  }),
  execute: async ({ task, files }) => {
    // #region agent log
    log(
      "app/api/chat/route.ts:70",
      "startEngineeringTask entry",
      { task, files },
      "A"
    );
    // #endregion

    try {
      // #region agent log
      log(
        "app/api/chat/route.ts:74",
        "Before start() call",
        {
          workflowType: typeof engineeringWorkflow,
          workflowName: engineeringWorkflow?.name,
          hasStart: typeof start !== "undefined",
          workflowToString: String(engineeringWorkflow).substring(0, 200),
          workflowKeys: engineeringWorkflow
            ? Object.keys(engineeringWorkflow)
            : [],
          workflowMetadata: (engineeringWorkflow as any)?.[
            Symbol.for("workflow")
          ],
          workflowFile: (engineeringWorkflow as any)?.__workflowFile,
          workflowId: (engineeringWorkflow as any)?.__workflowId,
        },
        "B"
      );
      // #endregion

      const run = await start(engineeringWorkflow, [
        {
          task,
          targetFiles: files,
        },
      ]);

      // #region agent log
      log(
        "app/api/chat/route.ts:89",
        "After start() call",
        {
          runType: typeof run,
          runKeys: run ? Object.keys(run) : null,
          hasRunId: run ? "runId" in run : false,
          runId: run?.runId,
          runStatus: run?.status,
        },
        "D"
      );
      // #endregion

      const result = {
        workflowId: run.runId,
        message: "Engineering task started. I'll create a draft PR when ready.",
      };

      // #region agent log
      log(
        "app/api/chat/route.ts:100",
        "startEngineeringTask success",
        result,
        "A"
      );
      // #endregion

      return result;
    } catch (error) {
      // #region agent log
      log(
        "app/api/chat/route.ts:105",
        "startEngineeringTask error",
        {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorType: error?.constructor?.name,
        },
        "E"
      );
      // #endregion
      throw error;
    }
  },
});

// Combine base tools with workflow triggers
const royTools = {
  ...baseRoyTools,
  startDesignTask,
  startEngineeringTask,
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-4o",
    system: ROY_SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: royTools,
    stopWhen: stepCountIs(10), // Allow multi-step tool use
  });

  return result.toUIMessageStreamResponse();
}
