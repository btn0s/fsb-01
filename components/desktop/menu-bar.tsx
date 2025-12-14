"use client";

import { cn } from "@/lib/utils";
import { WifiIcon, BatteryFullIcon, SearchIcon } from "lucide-react";

export function MenuBar() {
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40",
        "h-6 px-4",
        "bg-card/60 backdrop-blur-2xl",
        "border-b border-border",
        "flex items-center justify-between",
        "text-[11px]"
      )}
    >
      {/* Left side - Apple logo and app menus */}
      <div className="flex items-center gap-4">
        <span className="text-foreground"></span>
        <span className="text-foreground font-medium">Finder</span>
        <span className="text-muted-foreground">File</span>
        <span className="text-muted-foreground">Edit</span>
        <span className="text-muted-foreground">View</span>
        <span className="text-muted-foreground">Go</span>
        <span className="text-muted-foreground">Window</span>
        <span className="text-muted-foreground">Help</span>
      </div>

      {/* Right side - System icons */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <WifiIcon className="size-3" />
        <BatteryFullIcon className="size-3.5" />
        <SearchIcon className="size-3" />
        <span>
          {currentDate} {currentTime}
        </span>
      </div>
    </div>
  );
}
