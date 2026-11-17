import type { CSSProperties } from "react";
import { Minus, Square, X } from "lucide-react";

interface OctopusWindowApi {
  window?: {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<boolean>;
    close: () => Promise<void>;
  };
}

function bridge(): OctopusWindowApi | undefined {
  return (window as unknown as { octopus?: OctopusWindowApi }).octopus;
}

/** Frameless-window chrome, rendered only inside the Electron desktop app. */
export function TitleBar() {
  const octopus = bridge();
  if (!octopus?.window) return null;

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-between border-b border-km-border bg-km-panel select-none"
      style={{ WebkitAppRegion: "drag" } as CSSProperties}
    >
      <div className="flex items-center gap-2 px-3">
        <img src="./assets/logo.png" alt="" className="h-4 w-4 rounded-sm" />
        <span className="text-xs font-medium text-km-dim">Soloman Manager</span>
      </div>
      <div
        className="flex h-full"
        style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
      >
        <button
          data-window="minimize"
          aria-label="Minimize"
          onClick={() => octopus.window!.minimize()}
          className="flex h-full w-11 items-center justify-center text-km-dim transition-colors hover:bg-km-raised hover:text-km-text"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          data-window="maximize"
          aria-label="Maximize"
          onClick={() => octopus.window!.toggleMaximize()}
          className="flex h-full w-11 items-center justify-center text-km-dim transition-colors hover:bg-km-raised hover:text-km-text"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          data-window="close"
          aria-label="Close"
          onClick={() => octopus.window!.close()}
          className="flex h-full w-11 items-center justify-center text-km-dim transition-colors hover:bg-red-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
