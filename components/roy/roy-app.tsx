"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRoy } from "./roy-provider";
import { RoyLogo } from "./roy-logo";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarInset,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  ListTodo,
  Loader2,
  CheckCircle2,
  XCircle,
  Paintbrush,
  GitPullRequest,
  Plus,
  Trash2,
  ExternalLink,
  SendIcon,
} from "lucide-react";

const WORKFLOW_CONFIG = {
  design: { icon: Paintbrush, label: "Design" },
  engineering: { icon: GitPullRequest, label: "Engineering" },
};

const APP_POSITION_KEY = "roy-app-position";
const APP_SIZE_KEY = "roy-app-size";
const APP_SIDEBAR_COLLAPSED_KEY = "roy-app-sidebar-collapsed";

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const SIDEBAR_WIDTH = 200;

type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

interface DesignResult {
  type: "design";
  previewUrl: string;
  chatId: string;
  projectId: string;
  files: string[];
}

interface EngineeringResult {
  type: "engineering";
  prUrl: string;
  prNumber: number;
  branch: string;
  files: string[];
}

type WorkflowResult = DesignResult | EngineeringResult;

function TaskItem({
  workflow,
}: {
  workflow: {
    id: string;
    type: "design" | "engineering";
    status: string;
    startedAt: number;
    result?: WorkflowResult;
  };
}) {
  const [elapsed, setElapsed] = useState(0);
  const config = WORKFLOW_CONFIG[workflow.type];
  const Icon = config.icon;

  const isRunning = workflow.status === "running";
  const isComplete = workflow.status === "completed";
  const isError = workflow.status === "error";

  useEffect(() => {
    if (!isRunning) return;
    setElapsed(Math.floor((Date.now() - workflow.startedAt) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - workflow.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, workflow.startedAt]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getResultUrl = () => {
    if (!workflow.result) return null;
    if (workflow.result.type === "design") {
      return workflow.result.previewUrl;
    }
    return workflow.result.prUrl;
  };

  const resultUrl = getResultUrl();

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center size-8 rounded-lg shrink-0",
            isRunning && "bg-primary/20 text-primary",
            isComplete && "bg-primary/20 text-primary",
            isError && "bg-destructive/20 text-destructive"
          )}
        >
          {isRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isComplete ? (
            <CheckCircle2 className="size-4" />
          ) : isError ? (
            <XCircle className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {config.label}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {isRunning
              ? formatTime(elapsed)
              : isComplete
              ? "Completed"
              : "Failed"}
          </p>
        </div>
      </div>

      {isComplete && resultUrl && (
        <a
          href={resultUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 px-3 py-2 ml-11",
            "text-xs text-primary hover:text-primary",
            "bg-muted hover:bg-muted/80 rounded-md",
            "transition-colors"
          )}
        >
          <ExternalLink className="size-3" />
          {workflow.type === "design"
            ? "Open Preview"
            : `View PR #${(workflow.result as EngineeringResult)?.prNumber}`}
        </a>
      )}

      {isComplete &&
        workflow.result?.files &&
        workflow.result.files.length > 0 && (
          <div className="ml-11 text-xs text-muted-foreground">
            {workflow.result.files.length} file
            {workflow.result.files.length !== 1 ? "s" : ""}{" "}
            {workflow.type === "design" ? "generated" : "modified"}
          </div>
        )}
    </div>
  );
}

function ResizeHandle({
  direction,
  onResizeStart,
}: {
  direction: ResizeDirection;
  onResizeStart: (
    direction: ResizeDirection,
    startX: number,
    startY: number
  ) => void;
}) {
  const getCursor = () => {
    const cursors: Record<ResizeDirection, string> = {
      n: "ns-resize",
      ne: "nesw-resize",
      e: "ew-resize",
      se: "nwse-resize",
      s: "ns-resize",
      sw: "nwse-resize",
      w: "ew-resize",
      nw: "nesw-resize",
    };
    return cursors[direction];
  };

  const getPosition = () => {
    const positions: Record<ResizeDirection, string> = {
      n: "top-0 left-0 right-0 h-1",
      ne: "top-0 right-0 w-1 h-1",
      e: "top-0 bottom-0 right-0 w-1",
      se: "bottom-0 right-0 w-1 h-1",
      s: "bottom-0 left-0 right-0 h-1",
      sw: "bottom-0 left-0 w-1 h-1",
      w: "top-0 bottom-0 left-0 w-1",
      nw: "top-0 left-0 w-1 h-1",
    };
    return positions[direction];
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onResizeStart(direction, e.clientX, e.clientY);
  };

  return (
    <div
      className={cn(
        "absolute z-50",
        getPosition(),
        "hover:bg-muted/50 transition-colors"
      )}
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
    />
  );
}

export function RoyApp() {
  const {
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
  } = useRoy();

  const [activeTab, setActiveTab] = useState<"chat" | "tasks">("chat");
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] =
    useState<ResizeDirection | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
  });

  const windowRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load saved state
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem(APP_POSITION_KEY);
      if (savedPos) setPosition(JSON.parse(savedPos));
      const savedSize = localStorage.getItem(APP_SIZE_KEY);
      if (savedSize) setSize(JSON.parse(savedSize));
      const savedCollapsed = localStorage.getItem(APP_SIDEBAR_COLLAPSED_KEY);
      if (savedCollapsed) setSidebarCollapsed(JSON.parse(savedCollapsed));
    } catch {
      // Ignore
    }
  }, []);

  // Auto-collapse sidebar on small windows
  useEffect(() => {
    if (size.width < 500 && !sidebarCollapsed) {
      setSidebarCollapsed(true);
      localStorage.setItem(APP_SIDEBAR_COLLAPSED_KEY, JSON.stringify(true));
    }
  }, [size.width, sidebarCollapsed]);

  // Handle Cmd+K to focus input when app is open
  useEffect(() => {
    if (!isAppOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") {
        e.preventDefault();
        e.stopPropagation();

        // Find and focus the textarea
        const textarea = windowRef.current?.querySelector(
          'textarea[placeholder="Message Roy..."]'
        ) as HTMLTextAreaElement | null;

        if (textarea) {
          textarea.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAppOpen]);

  // Handle window dragging
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      // Don't drag if clicking on buttons
      if (e.target.closest("button") || e.target.closest("[role='button']")) {
        return;
      }
    }
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    let currentPos = position;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      // Constrain to viewport
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;

      currentPos = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      };

      setPosition(currentPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(APP_POSITION_KEY, JSON.stringify(currentPos));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position, size]);

  // Handle window resizing
  const handleResizeStart = useCallback(
    (direction: ResizeDirection, startX: number, startY: number) => {
      setIsResizing(true);
      setResizeDirection(direction);
      setResizeStart({
        x: startX,
        y: startY,
        width: size.width,
        height: size.height,
        posX: position.x,
        posY: position.y,
      });
    },
    [size, position]
  );

  useEffect(() => {
    if (!isResizing || !resizeDirection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      // Calculate new dimensions based on direction
      if (resizeDirection.includes("e")) {
        newWidth = Math.max(MIN_WIDTH, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes("w")) {
        newWidth = Math.max(MIN_WIDTH, resizeStart.width - deltaX);
        newX = resizeStart.posX + (resizeStart.width - newWidth);
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.max(MIN_HEIGHT, resizeStart.height + deltaY);
      }
      if (resizeDirection.includes("n")) {
        newHeight = Math.max(MIN_HEIGHT, resizeStart.height - deltaY);
        newY = resizeStart.posY + (resizeStart.height - newHeight);
      }

      // Constrain to viewport
      const maxWidth = window.innerWidth - newX;
      const maxHeight = window.innerHeight - newY;
      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.min(newHeight, maxHeight);
      newX = Math.max(0, Math.min(newX, window.innerWidth - MIN_WIDTH));
      newY = Math.max(0, Math.min(newY, window.innerHeight - MIN_HEIGHT));

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      // Save state after resize completes
      const currentSize = windowRef.current
        ? {
            width: windowRef.current.offsetWidth,
            height: windowRef.current.offsetHeight,
          }
        : size;
      localStorage.setItem(APP_SIZE_KEY, JSON.stringify(currentSize));
      localStorage.setItem(APP_POSITION_KEY, JSON.stringify(position));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart, position, size]);

  const handleSubmit = useCallback(
    (message: { text: string; files: unknown[] }) => {
      if (message.text.trim()) {
        sendMessage(message.text);
      }
    },
    [sendMessage]
  );

  const getMessageText = (message: (typeof messages)[0]) => {
    return message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("\n\n");
  };

  const handleNewChat = () => {
    createThread();
    setActiveTab("chat");
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setActiveTab("chat");
  };

  const hasMessages = messages.length > 0;
  const threadWorkflows = activeThread?.workflows || [];

  return (
    <AnimatePresence>
      {isAppOpen && (
        <motion.div
          ref={windowRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            zIndex: 50,
          }}
          className={cn(
            "flex flex-col",
            "bg-card border border-border",
            "rounded-xl shadow-2xl",
            "overflow-hidden",
            isResizing && "select-none"
          )}
        >
          {/* Resize handles */}
          {(
            ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as ResizeDirection[]
          ).map((dir) => (
            <ResizeHandle
              key={dir}
              direction={dir}
              onResizeStart={handleResizeStart}
            />
          ))}

          {/* Title bar */}
          <div
            onMouseDown={handleTitleBarMouseDown}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5",
              "bg-muted/50 border-b border-border",
              "cursor-grab active:cursor-grabbing",
              "select-none"
            )}
          >
            {/* Traffic light buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAppOpen(false);
                }}
                className="size-3 rounded-full bg-destructive hover:bg-destructive/80 transition-colors"
                aria-label="Close"
              />
              <button
                className="size-3 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors opacity-50 cursor-not-allowed"
                aria-label="Minimize"
                disabled
              />
              <button
                className="size-3 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors opacity-50 cursor-not-allowed"
                aria-label="Maximize"
                disabled
              />
            </div>
          </div>

          {/* Content area */}
          <SidebarProvider
            open={!sidebarCollapsed}
            onOpenChange={(open) => {
              setSidebarCollapsed(!open);
              localStorage.setItem(
                APP_SIDEBAR_COLLAPSED_KEY,
                JSON.stringify(!open)
              );
            }}
            className="flex flex-1 min-h-0 h-full [&>div]:min-h-0"
            style={{ minHeight: 0 }}
          >
            <div className="flex flex-1 min-h-0 h-full overflow-hidden">
              {/* Sidebar */}
              <motion.div
                initial={false}
                animate={{
                  width: sidebarCollapsed ? 0 : SIDEBAR_WIDTH,
                  opacity: sidebarCollapsed ? 0 : 1,
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden shrink-0"
                style={{ maxWidth: SIDEBAR_WIDTH }}
              >
                <Sidebar
                  collapsible="none"
                  className="h-full border-r border-sidebar-border w-full overflow-hidden flex flex-col"
                >
                  <SidebarHeader className="shrink-0">
                    <div className="flex items-center gap-2 px-2 py-2 mb-2">
                      <RoyLogo size="sm" />
                      <span
                        className={cn(
                          "text-sm font-semibold text-sidebar-foreground",
                          size.width < 250 && "hidden"
                        )}
                      >
                        Roy
                      </span>
                    </div>
                    <Button
                      onClick={handleNewChat}
                      variant="secondary"
                      className={cn(
                        "w-full",
                        size.width < 350 ? "justify-center" : "justify-start"
                      )}
                    >
                      <Plus />
                      {size.width >= 350 && <span>New Chat</span>}
                    </Button>
                  </SidebarHeader>

                  <SidebarContent className="overflow-x-hidden">
                    <SidebarGroup>
                      {size.width >= 250 && (
                        <SidebarGroupLabel>Conversations</SidebarGroupLabel>
                      )}
                      <SidebarMenu>
                        {threads.map((thread) => {
                          const isActive = thread.id === activeThreadId;
                          const hasRunning = thread.workflows.some(
                            (w) => w.status === "running"
                          );
                          return (
                            <SidebarMenuItem key={thread.id}>
                              <SidebarMenuButton
                                isActive={isActive}
                                onClick={() => handleSelectThread(thread.id)}
                              >
                                <MessageSquare className="size-4" />
                                {size.width >= 250 && (
                                  <span className="flex-1 truncate">
                                    {thread.title || "New conversation"}
                                  </span>
                                )}
                                {hasRunning && (
                                  <Loader2 className="size-3 animate-spin text-primary" />
                                )}
                              </SidebarMenuButton>
                              <SidebarMenuAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteThread(thread.id);
                                }}
                                showOnHover
                              >
                                <Trash2 className="size-3" />
                              </SidebarMenuAction>
                            </SidebarMenuItem>
                          );
                        })}
                        {threads.length === 0 && (
                          <div className="px-3 py-4 text-xs text-sidebar-foreground/70 text-center">
                            No conversations yet
                          </div>
                        )}
                      </SidebarMenu>
                    </SidebarGroup>
                  </SidebarContent>
                </Sidebar>
              </motion.div>
              {/* Main content */}
              <SidebarInset className="flex flex-col min-w-0 min-h-0">
                {activeThreadId ? (
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-background">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-foreground truncate">
                          {activeThread?.title || "New conversation"}
                        </h2>
                        {threadWorkflows.some(
                          (w) => w.status === "running"
                        ) && (
                          <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                        )}
                      </div>
                      <Tabs
                        value={activeTab}
                        onValueChange={(v) =>
                          setActiveTab(v as "chat" | "tasks")
                        }
                      >
                        <TabsList>
                          <TabsTrigger value="chat">
                            <MessageSquare />
                            <span className={cn(size.width < 400 && "hidden")}>
                              Chat
                            </span>
                          </TabsTrigger>
                          <TabsTrigger value="tasks">
                            <ListTodo />
                            <span className={cn(size.width < 400 && "hidden")}>
                              Tasks
                            </span>
                            {threadWorkflows.length > 0 && (
                              <Badge variant="secondary" className="ml-1">
                                {threadWorkflows.length}
                              </Badge>
                            )}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Content area */}
                    {activeTab === "chat" ? (
                      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        {/* Chat messages */}
                        <div className="flex-1 min-h-0">
                          <Conversation className="flex-1 min-h-0 h-full">
                            <ConversationContent>
                              {hasMessages ? (
                                messages.map((message) => {
                                  const text = getMessageText(message);
                                  if (!text) return null;

                                  return (
                                    <Message
                                      key={message.id}
                                      from={message.role}
                                    >
                                      <MessageContent>
                                        <MessageResponse>
                                          {text}
                                        </MessageResponse>
                                      </MessageContent>
                                    </Message>
                                  );
                                })
                              ) : (
                                <ConversationEmptyState
                                  title="Start a conversation with Roy"
                                  icon={
                                    <RoyLogo size="lg" className="opacity-50" />
                                  }
                                />
                              )}

                              {isProcessing && (
                                <Message from="assistant">
                                  <MessageContent>
                                    <div className="flex items-center gap-2">
                                      <Loader size={14} />
                                      <span className="text-muted-foreground">
                                        thinking...
                                      </span>
                                    </div>
                                  </MessageContent>
                                </Message>
                              )}
                            </ConversationContent>
                            <ConversationScrollButton />
                          </Conversation>
                        </div>

                        {/* Chat input */}
                        <div className="p-3 shrink-0 bg-background">
                          <PromptInput onSubmit={handleSubmit}>
                            <PromptInputTextarea placeholder="Message Roy..." />
                            <PromptInputFooter className="justify-end">
                              <PromptInputSubmit
                                status={isProcessing ? "submitted" : "ready"}
                                size="sm"
                                className="gap-2"
                              >
                                {isProcessing ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <>
                                    <SendIcon className="size-4" />
                                    <span>Send</span>
                                  </>
                                )}
                              </PromptInputSubmit>
                            </PromptInputFooter>
                          </PromptInput>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="flex-1 p-4">
                        {threadWorkflows.length > 0 ? (
                          <div className="space-y-2">
                            {threadWorkflows.map((wf) => (
                              <TaskItem key={wf.id} workflow={wf} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <ListTodo className="size-8 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                              No tasks in this conversation
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <RoyLogo size="lg" className="mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a conversation or start a new one
                    </p>
                    <Button onClick={handleNewChat}>
                      <Plus />
                      <span>New Chat</span>
                    </Button>
                  </div>
                )}
              </SidebarInset>
            </div>
          </SidebarProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
