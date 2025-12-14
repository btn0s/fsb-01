"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRoy } from "./roy-provider";
import { RoyLogo } from "./roy-logo";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Paintbrush,
  GitPullRequest,
  ChevronDown,
} from "lucide-react";

const WORKFLOW_CONFIG = {
  design: { icon: Paintbrush, label: "Design" },
  engineering: { icon: GitPullRequest, label: "Engineering" },
};

function WorkflowItem({
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
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div
        className={cn(
          "flex items-center justify-center size-8 rounded-full",
          isRunning && "bg-blue-500/20 text-blue-500",
          isComplete && "bg-green-500/20 text-green-500",
          isError && "bg-red-500/20 text-red-500"
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
        <p className="text-sm font-medium truncate">{config.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {isRunning ? formatTime(elapsed) : isComplete ? "Done" : "Failed"}
        </p>
      </div>
    </div>
  );
}

export function RoyTaskWidget() {
  const { workflows, hasActiveWorkflows } = useRoy();
  const [isExpanded, setIsExpanded] = useState(false);

  const runningCount = workflows.filter((w) => w.status === "running").length;

  // Only show when there are workflows
  if (workflows.length === 0) return null;

  return (
    <div className="fixed top-14 left-4 z-50">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          // Expanded view - full task list
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-72 overflow-hidden",
              "rounded-xl border border-border",
              "bg-background/95 backdrop-blur-xl",
              "shadow-lg"
            )}
          >
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 px-4 py-3 border-b border-border w-full hover:bg-muted/50 transition-colors"
            >
              <RoyLogo size="sm" />
              <h3 className="text-sm font-semibold flex-1 text-left">Tasks</h3>
              {hasActiveWorkflows && (
                <span className="flex size-2 mr-2">
                  <span className="absolute inline-flex size-2 rounded-full bg-blue-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
                </span>
              )}
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>

            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="p-2 space-y-2 max-h-80 overflow-y-auto"
            >
              {workflows.map((wf) => (
                <WorkflowItem key={wf.id} workflow={wf} />
              ))}
            </motion.div>
          </motion.div>
        ) : (
          // Collapsed view - just the indicator
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsExpanded(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              "bg-background/95 backdrop-blur-xl",
              "border border-border/50 rounded-full",
              "shadow-lg shadow-black/10",
              "hover:shadow-xl hover:scale-105 transition-all",
              "cursor-pointer"
            )}
          >
            <RoyLogo size="sm" />
            <span className="text-sm font-medium text-foreground">
              {runningCount > 0
                ? `${runningCount} task${runningCount !== 1 ? "s" : ""} running`
                : `${workflows.length} task${
                    workflows.length !== 1 ? "s" : ""
                  }`}
            </span>
            {hasActiveWorkflows && (
              <Loader2 className="size-4 text-primary animate-spin" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
