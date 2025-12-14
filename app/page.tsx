"use client";

import Image from "next/image";
import { RoyProvider, RoyHUD, useRoy } from "@/components/roy";
import { MenuBar, Dock } from "@/components/desktop";
import { cn } from "@/lib/utils";

function HintMessage() {
  const { isOpen } = useRoy();

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      <p
        className={cn(
          "text-sm px-4 py-2 rounded-lg bg-background/90 backdrop-blur-sm text-foreground shadow-lg transition-all duration-300",
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

        {/* Dock */}
        <Dock />

        {/* Roy HUD */}
        <RoyHUD />
      </main>
    </RoyProvider>
  );
}
