import type { UIMessage } from "ai";

// Roy-specific message type with tool inference
export type RoyMessage = UIMessage;

// Content types for the knowledge base
export type ContentType =
  | "okr"
  | "prd"
  | "transcript"
  | "task"
  | "decision"
  | "unknown";

export interface ContentFile {
  path: string;
  filename: string;
  type: ContentType;
  content: string;
  title?: string;
}

export interface SearchResult {
  file: ContentFile;
  snippet: string;
  relevance: number;
}

// Roy state machine
export type RoyState =
  | { type: "idle" }
  | { type: "listening"; transcript: string; interimTranscript: string }
  | { type: "processing"; message: string }
  | { type: "responding"; message: string }
  | { type: "background"; tasks: BackgroundTask[] };

// Tool result types
export interface ContextSearchResult {
  results: SearchResult[];
  query: string;
}

export interface PrototypeVariant {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
  files?: { path: string; content: string }[];
}

export interface PrototypeResult {
  variants: PrototypeVariant[];
  spec: string;
}

export interface PRResult {
  prUrl: string;
  prNumber: number;
  branchName: string;
  previewUrl?: string;
}

