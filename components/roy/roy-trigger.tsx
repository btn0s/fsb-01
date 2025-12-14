"use client";

import { motion } from "motion/react";
import { useRoy } from "./roy-provider";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating trigger button to open Roy
 * Shows when Roy is idle and not open
 */
export function RoyTrigger() {
  const { isOpen, toggle, messages, hasActiveTasks } = useRoy();

  // Don't show if Roy is open or has active tasks (badge shows instead)
  if (isOpen || hasActiveTasks) return null;

  const hasHistory = messages.length > 0;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "flex items-center justify-center",
        "size-14 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/25",
        "hover:shadow-xl hover:shadow-primary/30",
        "transition-shadow"
      )}
    >
      <SparklesIcon className="size-6" />

      {/* Notification dot for existing conversation */}
      {hasHistory && (
        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive border-2 border-background" />
      )}
    </motion.button>
  );
}
