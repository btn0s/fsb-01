import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ROY_SYSTEM_PROMPT } from "@/lib/roy/system-prompt";
import { chatTools } from "@/lib/roy/chat-tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: ROY_SYSTEM_PROMPT,
    messages,
    tools: chatTools,
    maxSteps: 10,
  });

  return result.toDataStreamResponse();
}
