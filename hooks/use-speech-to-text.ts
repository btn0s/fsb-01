"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type SpeechRecognitionResultList = {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export interface UseSpeechToTextReturn {
  /** Final transcript after speech ends */
  transcript: string;
  /** Real-time transcript while speaking */
  interimTranscript: string;
  /** Whether currently listening */
  isListening: boolean;
  /** Whether browser supports speech recognition */
  isSupported: boolean;
  /** Start listening */
  start: () => void;
  /** Stop listening */
  stop: () => void;
  /** Clear the transcript */
  clear: () => void;
  /** Error message if any */
  error: string | null;
}

const SILENCE_TIMEOUT = 2000; // 2 seconds of silence to auto-stop

export function useSpeechToText(): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      accumulatedTranscriptRef.current = "";
    };

    recognition.onend = () => {
      setIsListening(false);
      // Set final transcript when recognition ends
      if (accumulatedTranscriptRef.current) {
        setTranscript(accumulatedTranscriptRef.current);
      }
      setInterimTranscript("");
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";

        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (final) {
        accumulatedTranscriptRef.current += final;
        setTranscript(accumulatedTranscriptRef.current);
      }
      setInterimTranscript(interim);

      // Reset silence timer on any speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, SILENCE_TIMEOUT);
    };

    recognition.onerror = (event) => {
      // Map technical errors to user-friendly messages
      const errorMessages: Record<string, string> = {
        network: "Network error - voice input unavailable. Try typing instead.",
        "not-allowed":
          "Microphone access denied. Please allow microphone access.",
        "no-speech": "No speech detected. Try again.",
        aborted: "Voice input cancelled.",
        "audio-capture": "No microphone found.",
        "service-not-allowed": "Speech service not available.",
      };

      const friendlyError =
        errorMessages[event.error] || `Voice error: ${event.error}`;

      // Only log non-routine errors
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech recognition:", event.error);
      }

      setError(friendlyError);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isSupported]);

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported");
      return;
    }

    setTranscript("");
    setInterimTranscript("");
    setError(null);
    accumulatedTranscriptRef.current = "";

    try {
      recognitionRef.current.start();
    } catch {
      // Already started, ignore
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, [isListening]);

  const clear = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    clear,
    error,
  };
}
