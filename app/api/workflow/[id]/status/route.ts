import { getRun } from "workflow/api";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const run = await getRun(id);
    return Response.json({
      id: run.runId,
      status: run.status,
      result: run.returnValue,
    });
  } catch (error) {
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
