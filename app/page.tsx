"use client";

import Image from "next/image";
import { RoyProvider, RoyHUD } from "@/components/roy";
import { MenuBar, Dock } from "@/components/desktop";

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

        {/* Hint text - only shown when Roy is not active */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-foreground/50 text-sm">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
              ⌘K
            </kbd>{" "}
            to summon Roy
          </p>
        </div>

        {/* Dock */}
        <Dock />

        {/* Roy HUD */}
        <RoyHUD />
      </main>
    </RoyProvider>
  );
}
