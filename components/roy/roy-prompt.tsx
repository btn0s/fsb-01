"use client";

import { useRoy } from "./roy-provider";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Self-contained floating prompt with integrated chat
 * - Bottom: Input area
 * - Above: Chat messages (grows upward)
 */
export function RoyPrompt() {
  const { isOpen, setIsOpen, isProcessing, sendMessage, messages, isAppOpen } =
    useRoy();

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Refocus input when processing completes (disabled inputs lose focus)
  useEffect(() => {
    if (!isProcessing && isOpen && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isProcessing, isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setInputValue("");
  }, [setIsOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Close mini-chat when app opens
  useEffect(() => {
    if (isAppOpen && isOpen) {
      setIsOpen(false);
    }
  }, [isAppOpen, isOpen, setIsOpen]);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (text) {
      sendMessage(text);
      setInputValue("");
      inputRef.current?.focus();
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
      {isOpen && !isAppOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.15 }}
          onAnimationComplete={() => {
            inputRef.current?.focus();
          }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className={cn(
              "flex flex-col",
              "bg-card/95 backdrop-blur-xl",
              "rounded-2xl border border-border",
              "shadow-2xl shadow-black/50",
              "w-[500px]"
            )}
          >
            {/* Messages area - scrollable, grows upward */}
            {hasMessages && (
              <div
                ref={scrollRef}
                className="overflow-y-auto p-3 space-y-3 max-h-[120px]"
              >
                {messages.map((message) => {
                  const text = getMessageText(message);
                  if (!text) return null;

                  return (
                    <Message key={message.id} from={message.role}>
                      <MessageContent className="text-sm">
                        {message.role === "user" ? (
                          text
                        ) : (
                          <MessageResponse>{text}</MessageResponse>
                        )}
                      </MessageContent>
                    </Message>
                  );
                })}

                {/* Processing indicator */}
                {isProcessing && (
                  <Message from="assistant">
                    <MessageContent className="bg-transparent px-0 py-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader size={14} />
                        <span>thinking...</span>
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </div>
            )}

            {/* Input area */}
            <div className="p-3 bg-sidebar rounded-2xl">
              <input
                ref={inputRef}
                autoFocus
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
                  "w-full bg-transparent text-sm text-foreground",
                  "placeholder:text-muted-foreground outline-none"
                )}
                disabled={isProcessing}
              />
            </div>

            {/* Footer hint */}
            {/* <div className="px-1 pb-1 text-center">
              <span className="text-[10px] text-muted-foreground/50">
                Press Esc to close
              </span>
            </div> */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
