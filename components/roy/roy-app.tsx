"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { useRoy } from "./roy-provider";
import { RoyLogo } from "./roy-logo";
import { Loader } from "@/components/ai-elements/loader";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  ListTodo,
  Loader2,
  CheckCircle2,
  XCircle,
  Paintbrush,
  GitPullRequest,
  SendIcon,
  Plus,
  Trash2,
} from "lucide-react";

const WORKFLOW_CONFIG = {
  design: { icon: Paintbrush, label: "Design" },
  engineering: { icon: GitPullRequest, label: "Engineering" },
};

const APP_POSITION_KEY = "roy-app-position";
const APP_SIZE_KEY = "roy-app-size";

function TaskItem({
  workflow,
}: {
  workflow: {
    id: string;
    type: "design" | "engineering";
    status: string;
    startedAt: number;
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

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
      <div
        className={cn(
          "flex items-center justify-center size-8 rounded-lg",
          isRunning && "bg-blue-500/20 text-blue-500",
          isComplete && "bg-green-500/20 text-green-500",
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
  const [inputValue, setInputValue] = useState("");
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 500 });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Load saved position and size
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem(APP_POSITION_KEY);
      if (savedPos) setPosition(JSON.parse(savedPos));
      const savedSize = localStorage.getItem(APP_SIZE_KEY);
      if (savedSize) setSize(JSON.parse(savedSize));
    } catch {
      // Ignore
    }
  }, []);

  // Focus input when opening or switching to chat
  useEffect(() => {
    if (isAppOpen && activeTab === "chat" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isAppOpen, activeTab]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && activeTab === "chat") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (text) {
      sendMessage(text);
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [inputValue, sendMessage]);

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

  // Save position when drag ends
  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number; y: number } }
  ) => {
    const newPos = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    };
    setPosition(newPos);
    localStorage.setItem(APP_POSITION_KEY, JSON.stringify(newPos));
  };

  return (
    <AnimatePresence>
      {isAppOpen && (
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, scale: 0.95, x: position.x, y: position.y }}
          animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{ width: size.width, height: size.height }}
          className={cn(
            "fixed top-0 left-0 z-50",
            "flex flex-col",
            "bg-card border border-border",
            "rounded-xl shadow-2xl",
            "overflow-hidden"
          )}
        >
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-[200px] bg-muted/50 flex flex-col border-r border-border">
              {/* Drag handle + Window controls */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center gap-2 px-4 py-3 cursor-grab active:cursor-grabbing"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAppOpen(false);
                  }}
                  className="size-3 rounded-full bg-destructive hover:bg-destructive/80 transition-colors"
                />
                <div className="size-3 rounded-full bg-yellow-500" />
                <div className="size-3 rounded-full bg-green-500" />
              </div>

              {/* App title */}
              <div className="flex items-center gap-2 px-4 py-2">
                <RoyLogo size="sm" />
                <span className="text-sm font-semibold text-foreground">
                  Roy
                </span>
              </div>

              {/* New conversation button */}
              <div className="px-2 py-2">
                <Button
                  onClick={handleNewChat}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Plus className="size-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Threads list */}
              <ScrollArea className="flex-1 px-2 py-1">
                <p className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Conversations
                </p>
                <div className="space-y-0.5">
                  {threads.map((thread) => {
                    const isActive = thread.id === activeThreadId;
                    const hasRunning = thread.workflows.some(
                      (w) => w.status === "running"
                    );
                    return (
                      <div
                        key={thread.id}
                        className={cn(
                          "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        onClick={() => handleSelectThread(thread.id)}
                      >
                        <MessageSquare className="size-4 shrink-0" />
                        <span className="flex-1 truncate">
                          {thread.title || "New conversation"}
                        </span>
                        {hasRunning && (
                          <Loader2 className="size-3 animate-spin text-primary" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(thread.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-all"
                        >
                          <Trash2 className="size-3 text-muted-foreground" />
                        </button>
                      </div>
                    );
                  })}
                  {threads.length === 0 && (
                    <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                      No conversations yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
              {activeThreadId ? (
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "chat" | "tasks")}
                  className="flex flex-col flex-1"
                >
                  <TabsList
                    variant="line"
                    className="px-2 border-b border-border"
                  >
                    <TabsTrigger value="chat">
                      <MessageSquare className="size-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="tasks">
                      <ListTodo className="size-4" />
                      Tasks
                      {threadWorkflows.length > 0 && (
                        <Badge variant="secondary">
                          {threadWorkflows.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="chat"
                    className="flex flex-col flex-1 m-0"
                  >
                    {/* Chat messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div ref={scrollRef} className="space-y-4">
                        {hasMessages ? (
                          messages.map((message) => {
                            const text = getMessageText(message);
                            if (!text) return null;

                            const isUser = message.role === "user";

                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  "flex",
                                  isUser ? "justify-end" : "justify-start"
                                )}
                              >
                                {isUser ? (
                                  <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-primary text-primary-foreground text-sm">
                                    {text}
                                  </div>
                                ) : (
                                  <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-muted text-foreground text-sm">
                                    <MessageResponse>{text}</MessageResponse>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <RoyLogo size="lg" className="mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              Start a conversation with Roy
                            </p>
                          </div>
                        )}

                        {isProcessing && (
                          <div className="flex justify-start">
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-2xl text-sm text-muted-foreground">
                              <Loader size={14} />
                              <span>thinking...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Chat input */}
                    <div className="p-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Input
                          ref={inputRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit();
                            }
                          }}
                          placeholder="Message..."
                          disabled={isProcessing}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSubmit}
                          disabled={!inputValue.trim() || isProcessing}
                          size="icon"
                        >
                          <SendIcon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tasks" className="flex-1 m-0">
                    <ScrollArea className="h-full p-4">
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
                  </TabsContent>
                </Tabs>
              ) : (
                /* No thread selected */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <RoyLogo size="lg" className="mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a conversation or start a new one
                  </p>
                  <Button onClick={handleNewChat}>
                    <Plus className="size-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
