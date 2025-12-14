"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRoy } from "./roy-provider";
import { XIcon, Trash2Icon, MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import type { ToolUIPart } from "ai";

/**
 * Expandable panel showing the conversation with Roy
 */
export function RoyPanel() {
  const { isOpen, setIsOpen, messages, isProcessing, clear, toggle, uiState } =
    useRoy();

  // Only show panel when we have messages and not in initial prompt mode
  const showPanel = isOpen && messages.length > 0;

  return (
    <AnimatePresence>
      {showPanel && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed top-4 right-4 bottom-4 z-50",
            "w-full max-w-lg",
            "bg-background/95 backdrop-blur-xl",
            "border border-border/50 rounded-2xl",
            "shadow-2xl shadow-black/20",
            "flex flex-col overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-3 rounded-full",
                  uiState === "processing"
                    ? "bg-yellow-500 animate-pulse"
                    : uiState === "listening"
                    ? "bg-primary animate-pulse"
                    : "bg-green-500"
                )}
              />
              <h2 className="font-semibold text-foreground">Roy</h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggle}
                className={cn(uiState === "listening" && "text-primary")}
              >
                <MicIcon className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={clear}>
                <Trash2Icon className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts
                      ?.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <MessageResponse
                                key={`${message.id}-${partIndex}`}
                              >
                                {part.text}
                              </MessageResponse>
                            );

                          default:
                            // Handle tool parts
                            if (part.type.startsWith("tool-")) {
                              const toolPart = part as ToolUIPart;
                              const toolName = toolPart.type
                                .split("-")
                                .slice(1)
                                .join("-");

                              return (
                                <Tool
                                  key={`${message.id}-${partIndex}`}
                                  defaultOpen={
                                    toolPart.state !== "output-available"
                                  }
                                >
                                  <ToolHeader
                                    state={toolPart.state}
                                    type={toolPart.type}
                                    title={formatToolName(toolName)}
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
                            return null;
                        }
                      })
                      .filter(Boolean)}
                  </MessageContent>
                </Message>
              ))}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span
                      className="size-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="size-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="size-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span>Roy is thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer hint */}
          <div className="p-3 border-t border-border/50 text-center">
            <span className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted">⌘K</kbd> to
              talk to Roy
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

