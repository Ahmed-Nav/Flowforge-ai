"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("UI Render Error caught by Boundary:", error);
  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-retro-bg font-pixel text-retro-dark gap-6 p-8">
      <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
      <h1 className="text-4xl font-bold bg-retro-dark text-retro-bg px-4 py-2 uppercase">
        UI Render Crash
      </h1>
      <p className="text-center font-bold">
        The application encountered an unexpected state and halted to prevent data corruption.
      </p>
      <pre className="bg-black text-red-400 p-4 rounded border-4 border-retro-dark shadow-pixel text-sm font-mono w-full max-w-2xl overflow-auto whitespace-pre-wrap max-h-64">
        {error.message || "An unexpected error occurred."}
      </pre>
      <button
        onClick={() => reset()}
        className="mt-4 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl border-2 border-retro-dark shadow-[4px_4px_0px_#1D1D1D] uppercase transition-all active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_#1D1D1D]"
      >
        REBOOT SYSTEM [TRY AGAIN]
      </button>
    </div>
  );
}
