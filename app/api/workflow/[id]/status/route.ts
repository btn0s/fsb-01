import { getRun } from "workflow/api";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Try official API first (works in production)
    const run = await getRun(id);

    // Check if status is populated (production)
    if (run.status && typeof run.status === "string") {
      return Response.json({
        id: run.runId,
        status: run.status,
        result: run.returnValue,
      });
    }

    // Fallback: read from local files (local dev workaround)
    const workflowDataPath = join(
      process.cwd(),
      ".next",
      "workflow-data",
      "runs",
      `${id}.json`
    );

    const data = await readFile(workflowDataPath, "utf-8");
    const localRun = JSON.parse(data);

    return Response.json({
      id: localRun.runId,
      status: localRun.status,
      result: localRun.output,
    });
  } catch (error) {
    console.error("[workflow-status] Error fetching run:", error);
    return Response.json(
      {
        id,
        status: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 404 }
    );
  }
}
