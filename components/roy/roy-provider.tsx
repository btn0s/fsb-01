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

interface ChatThread {
  id: string;
  title?: string;
  createdAt: number;
  workflows: WorkflowRun[];
}

interface RoyContextValue {
  // UI state
  uiState: RoyUIState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAppOpen: boolean;
  setIsAppOpen: (open: boolean) => void;

  // Threads
  threads: ChatThread[];
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  setActiveThreadId: (id: string | null) => void;
  createThread: () => string;
  deleteThread: (id: string) => void;

  // Active thread chat
  messages: UIMessage[];
  sendMessage: (text: string) => void;
  isProcessing: boolean;
  error: Error | null;

  // Workflows (across all threads)
  allWorkflows: WorkflowRun[];
  hasActiveWorkflows: boolean;

  // Actions
  toggle: () => void;
  toggleApp: () => void;
  dismiss: () => void;
  startNewChat: () => void;
}

const RoyContext = createContext<RoyContextValue | null>(null);
const THREADS_STORAGE_KEY = "roy-threads";
const MESSAGES_STORAGE_PREFIX = "roy-messages-";

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

function generateThreadId() {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateTitle(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage?.parts) {
    const textPart = firstUserMessage.parts.find((p) => p.type === "text");
    if (textPart && "text" in textPart) {
      const text = textPart.text;
      return text.length > 40 ? text.slice(0, 40) + "..." : text;
    }
  }
  return "New conversation";
}

export function RoyProvider({ children }: RoyProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // useChat with thread ID for proper isolation
  const {
    messages,
    sendMessage: chatSendMessage,
    status,
    error: chatError,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: activeThreadId || undefined,
  });

  const isProcessing = status === "submitted" || status === "streaming";

  const uiState: RoyUIState = isProcessing
    ? "processing"
    : messages.length > 0 && status === "ready"
    ? "responding"
    : "idle";

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  // All workflows across all threads
  const allWorkflows = threads.flatMap((t) => t.workflows);
  const hasActiveWorkflows = allWorkflows.some((w) => w.status === "running");

  // Load threads from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THREADS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatThread[];
        setThreads(parsed);
        // If there are threads, set the most recent as active
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save threads to localStorage
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
    }
  }, [threads]);

  // Load messages when switching threads
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    try {
      const stored = localStorage.getItem(
        `${MESSAGES_STORAGE_PREFIX}${activeThreadId}`
      );
      if (stored) {
        const parsed = JSON.parse(stored) as UIMessage[];
        setMessages(parsed);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, [activeThreadId, setMessages]);

  // Save messages to localStorage when they change
  const prevMessagesRef = useRef<string>("");
  useEffect(() => {
    if (!activeThreadId || messages.length === 0) return;
    const serialized = JSON.stringify(messages);
    // Only save if messages actually changed
    if (serialized !== prevMessagesRef.current) {
      prevMessagesRef.current = serialized;
      localStorage.setItem(
        `${MESSAGES_STORAGE_PREFIX}${activeThreadId}`,
        serialized
      );
    }
  }, [activeThreadId, messages]);

  // Create a new thread
  const createThread = useCallback(() => {
    const newThread: ChatThread = {
      id: generateThreadId(),
      createdAt: Date.now(),
      workflows: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setMessages([]);
    prevMessagesRef.current = ""; // Reset so we don't carry over old messages
    return newThread.id;
  }, [setMessages]);

  // Delete a thread
  const deleteThread = useCallback(
    (id: string) => {
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setMessages([]);
      }
      // Clean up localStorage for this thread's messages
      localStorage.removeItem(`${MESSAGES_STORAGE_PREFIX}${id}`);
    },
    [activeThreadId, setMessages]
  );

  // Start new chat (creates thread and opens prompt)
  const startNewChat = useCallback(() => {
    createThread();
    setIsOpen(true);
  }, [createThread]);

  // Toggle opens prompt - if no active thread, create one
  const toggle = useCallback(() => {
    if (!isOpen && !activeThreadId) {
      createThread();
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, activeThreadId, createThread]);

  const toggleApp = useCallback(() => {
    setIsAppOpen((prev) => !prev);
  }, []);

  useVoiceShortcut(startNewChat, true);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      // Create thread if needed
      if (!activeThreadId) {
        createThread();
      }
      // Use the sendMessage function from useChat
      chatSendMessage({ text });
    },
    [activeThreadId, createThread, chatSendMessage]
  );

  // Update thread title when first message is sent
  useEffect(() => {
    if (activeThreadId && messages.length > 0) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId && !t.title
            ? { ...t, title: generateTitle(messages) }
            : t
        )
      );
    }
  }, [activeThreadId, messages]);

  // Extract workflows from messages and link to active thread
  useEffect(() => {
    if (!activeThreadId) return;

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
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== activeThreadId) return t;
          const updated = [...t.workflows];
          for (const newWf of foundWorkflows) {
            if (!updated.find((w) => w.id === newWf.id)) {
              updated.push(newWf);
            }
          }
          return { ...t, workflows: updated };
        })
      );
    }
  }, [messages, activeThreadId]);

  // Poll for workflow status updates across all threads
  useEffect(() => {
    const checkStatuses = async () => {
      const running = allWorkflows.filter((w) => w.status === "running");
      if (running.length === 0) return;

      for (const wf of running) {
        try {
          const res = await fetch(`/api/workflow/${wf.id}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed" || data.status === "failed") {
              setThreads((prev) =>
                prev.map((t) => ({
                  ...t,
                  workflows: t.workflows.map((w) =>
                    w.id === wf.id
                      ? {
                          ...w,
                          status:
                            data.status === "completed" ? "completed" : "error",
                        }
                      : w
                  ),
                }))
              );
            }
          }
        } catch {
          // Ignore errors
        }
      }
    };

    checkStatuses();
    pollingRef.current = setInterval(checkStatuses, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [allWorkflows]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value: RoyContextValue = {
    uiState,
    isOpen,
    setIsOpen,
    isAppOpen,
    setIsAppOpen,
    threads,
    activeThreadId,
    activeThread,
    setActiveThreadId,
    createThread,
    deleteThread,
    messages,
    sendMessage,
    isProcessing,
    error: chatError,
    allWorkflows,
    hasActiveWorkflows,
    toggle,
    toggleApp,
    dismiss,
    startNewChat,
  };

  return <RoyContext.Provider value={value}>{children}</RoyContext.Provider>;
}
