"use client";

import { useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import type { FileUIPart, ToolUIPart, UIMessage } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const examplePrompts = [
  "What's the weather in New York right now?",
  "How warm is Austin today? Convert it to celsius.",
];

export default function Page() {
  const { messages, sendMessage, status, stop, error } = useChat({
    api: "/api/chat",
  });

  const buildParts = useCallback(
    ({
      text,
      files,
    }: Pick<PromptInputMessage, "text" | "files">): UIMessage["parts"] => {
      const parts: UIMessage["parts"] = [];

      const trimmed = text.trim();
      if (trimmed.length > 0) {
        parts.push({ type: "text", text: trimmed });
      }

      if (files.length > 0) {
        parts.push(
          ...files.map<FileUIPart>((file) => ({
            type: "file",
            url: file.url,
            mediaType: file.mediaType,
            filename: file.filename,
          }))
        );
      }

      return parts;
    },
    []
  );

  const handlePromptSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const trimmed = message.text.trim();

      if (!trimmed && message.files.length === 0) {
        return;
      }

      try {
        // If we have text only, use the text property
        if (trimmed && message.files.length === 0) {
          await sendMessage({ text: trimmed });
          return;
        }

        // Otherwise, use parts for complex messages
        const parts = buildParts(message);
        if (parts.length === 0) {
          return;
        }

        await sendMessage({ parts });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    },
    [buildParts, sendMessage]
  );

  const handleExample = useCallback(
    async (prompt: string) => {
      await sendMessage({ text: prompt });
    },
    [sendMessage]
  );

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <ConversationEmptyState
          description="Try one of the quick prompts below to see the weather tools in action."
          title="Ready when you are"
        />
      );
    }

    return messages.map((message) => (
      <Message key={message.id} from={message.role}>
        <MessageContent>
          {message.parts
            .map((part, partIndex) => {
              switch (part.type) {
                case "text":
                  return (
                    <MessageResponse key={`${message.id}-${partIndex}`}>
                      {part.text}
                    </MessageResponse>
                  );

                case "tool-weather":
                case "tool-convertFahrenheitToCelsius": {
                  const toolPart = part as ToolUIPart;
                  const toolName = toolPart.type.split("-").slice(1).join("-");

                  return (
                    <Tool key={`${message.id}-${partIndex}`} defaultOpen>
                      <ToolHeader
                        state={toolPart.state}
                        type={toolPart.type}
                        title={toolName}
                      />
                      <ToolContent>
                        {toolPart.input && <ToolInput input={toolPart.input} />}
                        <ToolOutput
                          errorText={toolPart.errorText}
                          output={toolPart.output}
                        />
                      </ToolContent>
                    </Tool>
                  );
                }

                // Filter out internal metadata types
                case "step-start":
                case "step-finish":
                  return null;

                default:
                  // For tool types that start with "tool-", render them generically
                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as ToolUIPart;
                    const toolName = toolPart.type
                      .split("-")
                      .slice(1)
                      .join("-");

                    return (
                      <Tool key={`${message.id}-${partIndex}`} defaultOpen>
                        <ToolHeader
                          state={toolPart.state}
                          type={toolPart.type}
                          title={toolName}
                        />
                        <ToolContent>
                          {toolPart.input && (
                            <ToolInput input={toolPart.input} />
                          )}
                          <ToolOutput
                            errorText={toolPart.errorText}
                            output={toolPart.output}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }

                  // Don't render unknown part types
                  return null;
              }
            })
            .filter(Boolean)}
        </MessageContent>
      </Message>
    ));
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-background via-background to-muted/40">
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
        <Card className="shadow-lg">
          <CardHeader className="gap-4">
            <div>
              <CardTitle>AI SDK Quickstart</CardTitle>
              <CardDescription>
                Chat with a streaming UI powered by the Vercel AI Gateway,
                shadcn UI, and the ai-elements kit. Ask about the weather to see
                multi-step tool calls.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt) => (
                <Button
                  key={prompt}
                  size="sm"
                  variant="outline"
                  disabled={status === "streaming"}
                  onClick={() => handleExample(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex min-h-[60vh] flex-col gap-4 p-0">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
                Error: {error.message}
              </div>
            )}
            <Conversation>
              <ConversationContent>{renderMessages()}</ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col gap-3">
            <PromptInputProvider>
              <PromptInput onSubmit={handlePromptSubmit}>
                <PromptInputBody>
                  <PromptInputTextarea
                    disabled={status === "submitted" || status === "streaming"}
                  />
                </PromptInputBody>
                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputButton
                      disabled={status !== "streaming"}
                      onClick={stop}
                    >
                      Stop
                    </PromptInputButton>
                  </PromptInputTools>
                  <PromptInputSubmit
                    status={status}
                    disabled={status === "streaming" || status === "submitted"}
                  />
                </PromptInputFooter>
              </PromptInput>
            </PromptInputProvider>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
