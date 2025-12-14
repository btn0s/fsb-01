"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useVoiceShortcut } from "@/hooks/use-voice-shortcut";
import type { BackgroundTask } from "@/lib/roy/types";

type RoyUIState = "idle" | "processing" | "responding";

interface RoyContextValue {
  // UI State
  uiState: RoyUIState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  // Chat
  messages: UIMessage[];
  sendMessage: (text: string) => void;
  isProcessing: boolean;
  error: Error | null;

  // Background tasks
  backgroundTasks: BackgroundTask[];
  hasActiveTasks: boolean;

  // Actions
  toggle: () => void;
  dismiss: () => void;
  clear: () => void;
}

const RoyContext = createContext<RoyContextValue | null>(null);

export function useRoy() {
  const context = useContext(RoyContext);
  if (!context) {
    throw new Error("useRoy must be used within RoyProvider");
  }
  return context;
}

interface RoyProviderProps {
  children: React.ReactNode;
}

export function RoyProvider({ children }: RoyProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);

  // Chat
  const {
    messages,
    sendMessage: sendChatMessage,
    status,
    error: chatError,
    setMessages,
  } = useChat({
    api: "/api/chat",
  });

  const isProcessing = status === "submitted" || status === "streaming";

  // Compute UI state
  const uiState: RoyUIState = isProcessing
    ? "processing"
    : messages.length > 0 && status === "ready"
    ? "responding"
    : "idle";

  // Toggle Roy (keyboard shortcut)
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Keyboard shortcut
  useVoiceShortcut(toggle, true);

  // Send message
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      sendChatMessage({ text });
    },
    [sendChatMessage]
  );

  // Track background tasks from tool calls
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.parts) return;

    const toolParts = lastMessage.parts.filter((p) =>
      p.type.startsWith("tool-")
    );

    const tasks: BackgroundTask[] = toolParts.map((part) => {
      const toolPart = part as {
        type: string;
        state: string;
        toolCallId?: string;
      };
      const toolName = toolPart.type.replace("tool-", "");

      return {
        id: toolPart.toolCallId || toolName,
        name: toolName,
        description: `Running ${toolName}...`,
        status:
          toolPart.state === "output-available"
            ? "complete"
            : toolPart.state === "output-error"
            ? "error"
            : "running",
        startedAt: Date.now(),
      };
    });

    if (tasks.length > 0) {
      setBackgroundTasks(tasks);
    }
  }, [messages]);

  const hasActiveTasks = backgroundTasks.some((t) => t.status === "running");

  // Dismiss Roy
  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Clear conversation
  const clear = useCallback(() => {
    setMessages([]);
    setBackgroundTasks([]);
  }, [setMessages]);

  const value: RoyContextValue = {
    uiState,
    isOpen,
    setIsOpen,
    messages,
    sendMessage,
    isProcessing,
    error: chatError,
    backgroundTasks,
    hasActiveTasks,
    toggle,
    dismiss,
    clear,
  };

  return <RoyContext.Provider value={value}>{children}</RoyContext.Provider>;
}
