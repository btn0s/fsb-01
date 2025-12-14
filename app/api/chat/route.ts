import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  UIMessage,
} from "ai";
import { start } from "workflow/api";
import { royChatWorkflow } from "@/workflows/chat";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = convertToModelMessages(messages);

  const run = await start(royChatWorkflow, [modelMessages]);

  return createUIMessageStreamResponse({
    stream: run.readable,
  });
}
