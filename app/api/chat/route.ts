import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { royTools } from "@/lib/roy/tools";
import { ROY_SYSTEM_PROMPT } from "@/lib/roy/system-prompt";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

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
