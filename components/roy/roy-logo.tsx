"use client";

import { cn } from "@/lib/utils";

interface RoyLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RoyLogo({ size = "md", className }: RoyLogoProps) {
  const sizeClasses = {
    sm: "size-5 text-xs",
    md: "size-7 text-sm",
    lg: "size-10 text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 font-semibold text-white shadow-sm",
        sizeClasses[size],
        className
      )}
    >
      R
    </div>
  );
}
