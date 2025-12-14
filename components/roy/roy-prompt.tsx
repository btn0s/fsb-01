"use client";

import { useRoy } from "./roy-provider";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ai-elements/loader";
import { MessageResponse } from "@/components/ai-elements/message";
import { SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Self-contained floating prompt with integrated chat
 * - Bottom: Input area
 * - Above: Chat messages (grows upward)
 */
export function RoyPrompt() {
  const { isOpen, setIsOpen, isProcessing, sendMessage, messages } = useRoy();

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setInputValue("");
  }, [setIsOpen]);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (text) {
      sendMessage(text);
      setInputValue("");
      // Refocus input after sending
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [inputValue, sendMessage]);

  const hasMessages = messages.length > 0;

  // Extract text from message parts
  const getMessageText = (message: (typeof messages)[0]) => {
    return message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("\n\n");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className={cn(
              "flex flex-col",
              "bg-card/95 backdrop-blur-xl",
              "rounded-2xl border border-border",
              "shadow-2xl shadow-black/50",
              "w-[500px] max-h-[60vh]",
              "overflow-hidden"
            )}
          >
            {/* Header - only show when there are messages */}
            {hasMessages && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border">
                <div className="size-1.5 rounded-full bg-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Roy
                </span>
              </div>
            )}

            {/* Messages area - scrollable, grows upward */}
            {hasMessages && (
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[40vh]"
              >
                {messages.map((message) => {
                  const text = getMessageText(message);
                  if (!text) return null;

                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "text-sm",
                        isUser ? "flex justify-end" : "flex justify-start"
                      )}
                    >
                      {isUser ? (
                        <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-secondary text-secondary-foreground">
                          {text}
                        </div>
                      ) : (
                        <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-muted/50 text-foreground prose prose-sm prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                          <MessageResponse>{text}</MessageResponse>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-2xl text-sm text-muted-foreground">
                      <Loader size={14} />
                      <span>thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input area */}
            <div className={cn("p-3", hasMessages && "border-t border-border")}>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Message Roy..."
                  className={cn(
                    "flex-1 bg-transparent text-sm text-foreground",
                    "placeholder:text-muted-foreground outline-none"
                  )}
                  disabled={isProcessing}
                />
                {inputValue && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSubmit}
                    className="size-8 text-muted-foreground hover:text-foreground"
                    disabled={isProcessing}
                  >
                    <SendIcon className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Footer hint */}
            {!hasMessages && (
              <div className="px-3 pb-2 text-center">
                <span className="text-[10px] text-muted-foreground/50">
                  Press Esc to close
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
