"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRoy } from "./roy-provider";
import { Loader2Icon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Collapsed badge that shows when Roy is working in the background
 * "The horse running animation" - shows Roy is doing work
 */
export function RoyWorkingBadge() {
  const { backgroundTasks, hasActiveTasks, isProcessing, setIsOpen } = useRoy();

  const showBadge = hasActiveTasks || isProcessing;

  const completedTasks = backgroundTasks.filter((t) => t.status === "complete");
  const runningTasks = backgroundTasks.filter((t) => t.status === "running");
  const errorTasks = backgroundTasks.filter((t) => t.status === "error");

  const statusText = isProcessing
    ? "Thinking..."
    : runningTasks.length > 0
    ? `Running ${runningTasks.map((t) => t.name).join(", ")}...`
    : completedTasks.length > 0
    ? `${completedTasks.length} task${
        completedTasks.length > 1 ? "s" : ""
      } complete`
    : errorTasks.length > 0
    ? "Error occurred"
    : "";

  return (
    <AnimatePresence>
      {showBadge && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "flex items-center gap-2 px-4 py-2",
            "bg-background/95 backdrop-blur-xl",
            "border border-border/50 rounded-full",
            "shadow-lg shadow-black/10",
            "hover:shadow-xl hover:scale-105 transition-all",
            "cursor-pointer"
          )}
        >
          {/* Icon */}
          {isProcessing || runningTasks.length > 0 ? (
            <Loader2Icon className="size-4 text-primary animate-spin" />
          ) : completedTasks.length > 0 ? (
            <CheckCircleIcon className="size-4 text-green-500" />
          ) : errorTasks.length > 0 ? (
            <AlertCircleIcon className="size-4 text-destructive" />
          ) : null}

          {/* Status Text */}
          <span className="text-sm font-medium text-foreground">
            {statusText}
          </span>

          {/* Pulse indicator for active work */}
          {(isProcessing || runningTasks.length > 0) && (
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-primary" />
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

