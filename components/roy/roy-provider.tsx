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
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useVoiceShortcut } from "@/hooks/use-voice-shortcut";
import type { BackgroundTask } from "@/lib/roy/types";

type RoyUIState = "idle" | "listening" | "processing" | "responding";

interface RoyContextValue {
  // UI State
  uiState: RoyUIState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  // Voice
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;

  // TTS
  isSpeaking: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;

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
  const lastSpokenMessageId = useRef<string | null>(null);

  // Speech to text
  const {
    transcript,
    interimTranscript,
    isListening,
    start: startSTT,
    stop: stopSTT,
    clear: clearSTT,
    error: sttError,
  } = useSpeechToText();

  // Text to speech
  const { isSpeaking, speak, stop: stopTTS } = useTextToSpeech();

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
  const uiState: RoyUIState = isListening
    ? "listening"
    : isProcessing
    ? "processing"
    : messages.length > 0 && status === "ready"
    ? "responding"
    : "idle";

  // Toggle Roy (keyboard shortcut)
  const toggle = useCallback(() => {
    if (isListening) {
      stopSTT();
    } else {
      setIsOpen(true);
      startSTT();
    }
  }, [isListening, startSTT, stopSTT]);

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

  // Auto-send transcript when speech ends
  useEffect(() => {
    if (!isListening && transcript && transcript.trim()) {
      sendMessage(transcript);
      clearSTT();
    }
  }, [isListening, transcript, sendMessage, clearSTT]);

  // Auto-speak assistant responses
  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === "assistant" &&
      lastMessage.id !== lastSpokenMessageId.current
    ) {
      // Extract text from message
      const textContent = lastMessage.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join(" ");

      if (textContent) {
        lastSpokenMessageId.current = lastMessage.id;
        // Only speak if it's short-ish (avoid speaking long responses)
        if (textContent.length < 500) {
          speak(textContent);
        }
      }
    }
  }, [messages, status, speak]);

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
    stopSTT();
    stopTTS();
  }, [stopSTT, stopTTS]);

  // Clear conversation
  const clear = useCallback(() => {
    setMessages([]);
    setBackgroundTasks([]);
    clearSTT();
  }, [setMessages, clearSTT]);

  const value: RoyContextValue = {
    uiState,
    isOpen,
    setIsOpen,
    isListening,
    transcript,
    interimTranscript,
    startListening: startSTT,
    stopListening: stopSTT,
    isSpeaking,
    speak,
    stopSpeaking: stopTTS,
    messages,
    sendMessage,
    isProcessing,
    error: chatError || (sttError ? new Error(sttError) : null),
    backgroundTasks,
    hasActiveTasks,
    toggle,
    dismiss,
    clear,
  };

  return <RoyContext.Provider value={value}>{children}</RoyContext.Provider>;
}
