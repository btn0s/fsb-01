"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { useVoiceShortcut } from "@/hooks/use-voice-shortcut";

type RoyUIState = "idle" | "processing" | "responding";

interface WorkflowRun {
  id: string;
  type: "design" | "engineering";
  status: "running" | "completed" | "error";
  startedAt: number;
}

interface RoyContextValue {
  uiState: RoyUIState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: UIMessage[];
  sendMessage: (text: string) => void;
  isProcessing: boolean;
  error: Error | null;
  workflows: WorkflowRun[];
  hasActiveWorkflows: boolean;
  toggle: () => void;
  dismiss: () => void;
  clear: () => void;
}

const RoyContext = createContext<RoyContextValue | null>(null);
const STORAGE_KEY = "roy-workflows";

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

// Helper to parse nested stringified output
function parseWorkflowOutput(
  output: unknown
): { workflowId?: string; type?: string } | null {
  try {
    if (typeof output === "string") {
      const parsed = JSON.parse(output);
      // Structure: { type: "tool-result", output: { type: "text", value: "{workflowId, type}" } }
      if (parsed?.output?.value) {
        return JSON.parse(parsed.output.value);
      }
      return parsed;
    }
    if (typeof output === "object" && output !== null) {
      const obj = output as Record<string, unknown>;
      if (obj.workflowId) return obj as { workflowId: string; type?: string };
      if (obj.output && typeof obj.output === "object") {
        const inner = obj.output as Record<string, unknown>;
        if (inner.value && typeof inner.value === "string") {
          return JSON.parse(inner.value);
        }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function RoyProvider({ children }: RoyProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  const uiState: RoyUIState = isProcessing
    ? "processing"
    : messages.length > 0 && status === "ready"
    ? "responding"
    : "idle";

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useVoiceShortcut(toggle, true);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      sendChatMessage({ text });
    },
    [sendChatMessage]
  );

  // Load workflows from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WorkflowRun[];
        setWorkflows(parsed);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save workflows to localStorage when they change
  useEffect(() => {
    if (workflows.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    }
  }, [workflows]);

  // Poll for workflow status updates
  useEffect(() => {
    const checkStatuses = async () => {
      const running = workflows.filter((w) => w.status === "running");
      if (running.length === 0) return;

      for (const wf of running) {
        try {
          const res = await fetch(`/api/workflow/${wf.id}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed" || data.status === "failed") {
              setWorkflows((prev) =>
                prev.map((w) =>
                  w.id === wf.id
                    ? {
                        ...w,
                        status:
                          data.status === "completed" ? "completed" : "error",
                      }
                    : w
                )
              );
            }
          }
        } catch {
          // Ignore errors
        }
      }
    };

    // Check immediately on mount
    checkStatuses();

    // Poll every 5 seconds
    pollingRef.current = setInterval(checkStatuses, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [workflows]);

  // Extract sub-workflow runs from tool results
  useEffect(() => {
    const foundWorkflows: WorkflowRun[] = [];

    for (const message of messages) {
      if (!message.parts) continue;

      for (const part of message.parts) {
        if (part.type === "tool-workflow") {
          const toolPart = part as {
            toolCallId: string;
            state: string;
            output?: unknown;
          };

          const parsed = parseWorkflowOutput(toolPart.output);

          if (parsed?.workflowId) {
            const existing = foundWorkflows.find(
              (w) => w.id === parsed.workflowId
            );
            if (!existing) {
              foundWorkflows.push({
                id: parsed.workflowId,
                type: (parsed.type as "design" | "engineering") || "design",
                status: "running",
                startedAt: Date.now(),
              });
            }
          }
        }
      }
    }

    if (foundWorkflows.length > 0) {
      setWorkflows((prev) => {
        const updated = [...prev];
        for (const newWf of foundWorkflows) {
          if (!updated.find((w) => w.id === newWf.id)) {
            updated.push(newWf);
          }
        }
        return updated;
      });
    }
  }, [messages]);

  const hasActiveWorkflows = workflows.some((w) => w.status === "running");

  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setWorkflows([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [setMessages]);

  const value: RoyContextValue = {
    uiState,
    isOpen,
    setIsOpen,
    messages,
    sendMessage,
    isProcessing,
    error: chatError,
    workflows,
    hasActiveWorkflows,
    toggle,
    dismiss,
    clear,
  };

  return <RoyContext.Provider value={value}>{children}</RoyContext.Provider>;
}
