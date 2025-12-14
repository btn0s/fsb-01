"use client";

import Image from "next/image";
import {
  RoyProvider,
  RoyHUD,
  useRoy,
  RoyTaskWidget,
  RoyApp,
} from "@/components/roy";
import { MenuBar, Dock } from "@/components/desktop";
import { cn } from "@/lib/utils";

function HintMessage() {
  const { isOpen } = useRoy();

  return (
    <div className="fixed bottom-[72px] left-0 right-0 flex justify-center pointer-events-none z-10">
      <p
        className={cn(
          "text-xs px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm text-foreground shadow-lg transition-all duration-300",
          isOpen && "opacity-0 blur-sm scale-95"
        )}
      >
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
          ⌘K
        </kbd>{" "}
        to summon Roy
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <RoyProvider>
      {/* Desktop simulation */}
      <main className="relative min-h-screen overflow-hidden">
        {/* Desktop background */}
        <Image
          src="/bg.avif"
          alt="Desktop background"
          fill
          priority
          className="object-cover -z-10"
          quality={90}
        />

        {/* Menu bar */}
        <MenuBar />

        {/* Hint text - fades out when Roy is open */}
        <HintMessage />

        {/* Task widget - floating indicator */}
        <RoyTaskWidget />

        {/* Roy App - desktop app window */}
        <RoyApp />

        {/* Dock */}
        <Dock />

        {/* Roy HUD - ⌘K shortcut */}
        <RoyHUD />
      </main>
    </RoyProvider>
  );
}
