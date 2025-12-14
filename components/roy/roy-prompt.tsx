"use client";

import { useRoy } from "./roy-provider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ai-elements/loader";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { MicIcon, MicOffIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";

const EXAMPLE_PROMPTS = [
  {
    label: "Check priorities",
    prompt: "What should I prioritize this week based on our OKRs?",
  },
  {
    label: "Get meeting context",
    prompt: "What did we decide about onboarding in the last meeting?",
  },
  {
    label: "Review tasks",
    prompt: "What are the current blockers on my sprint?",
  },
  {
    label: "Generate prototypes",
    prompt: "Create some prototype variants for the new onboarding flow",
  },
];

/**
 * Spotlight-style command prompt using CommandDialog
 */
export function RoyPrompt() {
  const {
    isOpen,
    setIsOpen,
    isListening,
    transcript,
    interimTranscript,
    isProcessing,
    startListening,
    stopListening,
    sendMessage,
    error,
  } = useRoy();

  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Show voice errors briefly then clear
  useEffect(() => {
    if (
      error?.message?.includes("voice") ||
      error?.message?.includes("Voice") ||
      error?.message?.includes("Network") ||
      error?.message?.includes("Microphone")
    ) {
      setVoiceError(error.message);
      const timer = setTimeout(() => setVoiceError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [inputValue, setInputValue] = useState("");

  // Sync transcript to input when listening stops
  useEffect(() => {
    if (!isListening && transcript) {
      setInputValue(transcript);
    }
  }, [isListening, transcript]);

  const handleSubmit = useCallback(
    (value: string) => {
      const text = value.trim();
      if (text) {
        sendMessage(text);
        setInputValue("");
        setIsOpen(false);
      }
    },
    [sendMessage, setIsOpen]
  );

  const handleSelect = useCallback(
    (prompt: string) => {
      handleSubmit(prompt);
    },
    [handleSubmit]
  );

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const displayText = interimTranscript || transcript;

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Roy"
      description="Your AI operating system"
    >
      <Command shouldFilter={false}>
        {/* Voice error banner */}
        {voiceError && (
          <div className="flex items-center gap-2 border-b bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <MicOffIcon className="size-3.5" />
            <span>{voiceError}</span>
          </div>
        )}

        {/* Custom input with voice button */}
        <div className="flex items-center gap-2 border-b p-3">
          <Button
            size="icon-sm"
            variant={isListening ? "default" : voiceError ? "ghost" : "ghost"}
            onClick={toggleVoice}
            className={cn(
              isListening && "animate-pulse",
              voiceError && "text-muted-foreground"
            )}
            title={voiceError ? "Voice unavailable" : "Toggle voice input"}
          >
            {voiceError ? (
              <MicOffIcon className="size-3.5" />
            ) : (
              <MicIcon className="size-3.5" />
            )}
          </Button>

          <div className="flex-1">
            {isListening ? (
              <div className="flex items-center gap-2 text-sm">
                {displayText ? (
                  <span>{displayText}</span>
                ) : (
                  <Shimmer duration={1.5}>Listening...</Shimmer>
                )}
              </div>
            ) : (
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(inputValue);
                  }
                }}
                placeholder="Ask Roy anything..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
                disabled={isProcessing}
              />
            )}
          </div>

          {(inputValue || transcript) && !isListening && (
            <Button
              size="icon-sm"
              onClick={() => handleSubmit(inputValue || transcript)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader size={14} />
              ) : (
                <SendIcon className="size-3.5" />
              )}
            </Button>
          )}
        </div>

        <CommandList>
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader size={16} />
              <Shimmer duration={1.5}>Roy is thinking...</Shimmer>
            </div>
          ) : (
            <>
              <CommandEmpty>
                Press Enter to send, or select a suggestion below.
              </CommandEmpty>

              <CommandGroup heading="Suggestions">
                {EXAMPLE_PROMPTS.map((item) => (
                  <CommandItem
                    key={item.label}
                    onSelect={() => handleSelect(item.prompt)}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-2 text-muted-foreground truncate">
                      {item.prompt}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
          <span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>{" "}
            to toggle
          </span>
          <span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">↵</kbd>{" "}
            to send
          </span>
          <span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
              Esc
            </kbd>{" "}
            to close
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
