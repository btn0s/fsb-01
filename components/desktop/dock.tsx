"use client";

import { cn } from "@/lib/utils";
import { useRoy } from "@/components/roy/roy-provider";
import { RoyLogo } from "@/components/roy/roy-logo";
import {
  CompassIcon,
  MailIcon,
  CalendarIcon,
  MessageSquareIcon,
  MusicIcon,
  FolderIcon,
  SettingsIcon,
  TerminalIcon,
  CodeIcon,
} from "lucide-react";

const dockItems = [
  { icon: CompassIcon, label: "Safari" },
  { icon: MailIcon, label: "Mail" },
  { icon: CalendarIcon, label: "Calendar" },
  { icon: MessageSquareIcon, label: "Messages" },
  { icon: MusicIcon, label: "Music" },
  { icon: FolderIcon, label: "Finder" },
  { icon: TerminalIcon, label: "Terminal" },
  { icon: CodeIcon, label: "Cursor" },
  { icon: SettingsIcon, label: "Settings" },
];

export function Dock() {
  const { isAppOpen, setIsAppOpen } = useRoy();

  return (
    <div
      className={cn(
        "fixed bottom-2 left-1/2 -translate-x-1/2 z-30",
        "px-1.5 py-1",
        "bg-card/60 backdrop-blur-2xl",
        "rounded-2xl border border-border",
        "flex items-center gap-0.5"
      )}
    >
      {dockItems.map((item) => (
        <button
          key={item.label}
          className={cn(
            "group relative",
            "size-10 rounded-xl",
            "bg-muted/50 hover:bg-muted",
            "flex items-center justify-center",
            "transition-all duration-150",
            "hover:scale-110 hover:-translate-y-1"
          )}
        >
          <item.icon className="size-5 text-muted-foreground" />
          {/* Tooltip */}
          <span
            className={cn(
              "absolute -top-8 left-1/2 -translate-x-1/2",
              "px-2 py-1 rounded-md",
              "bg-popover text-popover-foreground text-xs",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity pointer-events-none",
              "whitespace-nowrap border border-border"
            )}
          >
            {item.label}
          </span>
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Roy */}
      <button
        onClick={() => setIsAppOpen(true)}
        className={cn(
          "group relative",
          "size-10 rounded-xl",
          "bg-muted/50 hover:bg-muted",
          "flex items-center justify-center",
          "transition-all duration-150",
          "hover:scale-110 hover:-translate-y-1"
        )}
      >
        <RoyLogo size="sm" />
        {/* Active indicator */}
        {isAppOpen && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-foreground" />
        )}
        {/* Tooltip */}
        <span
          className={cn(
            "absolute -top-8 left-1/2 -translate-x-1/2",
            "px-2 py-1 rounded-md",
            "bg-popover text-popover-foreground text-xs",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity pointer-events-none",
            "whitespace-nowrap border border-border"
          )}
        >
          Roy
        </span>
      </button>

      {/* Downloads */}
      <button
        className={cn(
          "group relative",
          "size-10 rounded-xl",
          "bg-muted/50 hover:bg-muted",
          "flex items-center justify-center",
          "transition-all duration-150",
          "hover:scale-110 hover:-translate-y-1"
        )}
      >
        <FolderIcon className="size-5 text-muted-foreground" />
        <span
          className={cn(
            "absolute -top-8 left-1/2 -translate-x-1/2",
            "px-2 py-1 rounded-md",
            "bg-popover text-popover-foreground text-xs",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity pointer-events-none",
            "whitespace-nowrap border border-border"
          )}
        >
          Downloads
        </span>
      </button>
    </div>
  );
}
