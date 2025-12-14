import { start } from "workflow/api";
import { designWorkflow } from "@/workflows/design";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  console.log("[test-workflow] POST handler called");
  // #region agent log
  log("app/api/test-workflow/route.ts:18", "POST handler entry", {}, "A");
  // #endregion

  try {
    console.log("[test-workflow] Parsing request body");
    const { task, requirements } = await request.json();
    console.log("[test-workflow] Parsed:", { task, requirements });

    // #region agent log
    log(
      "app/api/test-workflow/route.ts:24",
      "Before start() call",
      {
        task,
        requirements,
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

    // #region agent log
    log(
      "app/api/test-workflow/route.ts:36",
      "Calling start()",
      {
        args: { task, requirements },
      },
      "C"
    );
    // #endregion

    console.log("[test-workflow] About to call start()");
    console.log("[test-workflow] designWorkflow type:", typeof designWorkflow);
    console.log("[test-workflow] designWorkflow:", designWorkflow);

    const run = await start(designWorkflow, [
      {
        task: task || "Create a simple login form",
        requirements:
          requirements || "Modern design with email and password fields",
      },
    ]);

    console.log("[test-workflow] start() returned:", run);

    // #region agent log
    log(
      "app/api/test-workflow/route.ts:44",
      "After start() call",
      {
        runType: typeof run,
        runKeys: run ? Object.keys(run) : null,
        hasRunId: run ? "runId" in run : false,
        runId: run?.runId,
        runStatus: run?.status,
        runValue: run,
      },
      "D"
    );
    // #endregion

    // #region agent log
    log(
      "app/api/test-workflow/route.ts:53",
      "POST handler success",
      {
        workflowId: run.runId,
      },
      "A"
    );
    // #endregion

    return NextResponse.json({
      message: "Workflow started successfully",
      workflowId: run.runId,
    });
  } catch (error) {
    console.error("[test-workflow] Error caught:", error);
    console.error("[test-workflow] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // #region agent log
    log(
      "app/api/test-workflow/route.ts:62",
      "POST handler error",
      {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
      },
      "E"
    );
    // #endregion

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
