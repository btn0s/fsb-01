"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useRoy } from "./roy-provider";
import { RoyLogo } from "./roy-logo";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const STORAGE_KEY = "roy-indicator-position";

export function RoyTaskWidget() {
  const { allWorkflows, hasActiveWorkflows, setIsAppOpen } = useRoy();
  const [position, setPosition] = useState({ x: 16, y: 56 });
  const constraintsRef = useRef<HTMLDivElement>(null);

  const runningCount = allWorkflows.filter(
    (w) => w.status === "running"
  ).length;

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPosition(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save position on drag end
  const handleDragEnd = (
    _: unknown,
    info: { point: { x: number; y: number } }
  ) => {
    const newPos = { x: info.point.x, y: info.point.y };
    setPosition(newPos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos));
  };

  // Only show when there are workflows
  if (allWorkflows.length === 0) return null;

  return (
    <>
      {/* Drag constraints container */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-30"
      />

      {/* Draggable indicator */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ x: position.x, y: position.y }}
        className="fixed top-0 left-0 z-40 cursor-grab active:cursor-grabbing"
      >
        <button
          onClick={() => setIsAppOpen(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-2",
            "bg-card border border-border",
            "rounded-full shadow-lg",
            "hover:bg-accent transition-colors"
          )}
        >
          <RoyLogo size="sm" />
          <span className="text-sm font-medium text-foreground">
            {runningCount > 0
              ? `${runningCount} task${runningCount !== 1 ? "s" : ""}`
              : `${allWorkflows.length} task${
                  allWorkflows.length !== 1 ? "s" : ""
                }`}
          </span>
          {hasActiveWorkflows && (
            <Loader2 className="size-4 text-primary animate-spin" />
          )}
        </button>
      </motion.div>
    </>
  );
}
