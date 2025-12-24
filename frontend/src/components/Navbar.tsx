// frontend/src/components/Navbar.tsx
import { Zap } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full border-b-4 border-retro-dark bg-retro-bg p-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="bg-retro-primary p-2 border-2 border-retro-dark shadow-pixel">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-widest uppercase">
          FlowForge<span className="text-retro-primary">.AI</span>
        </h1>
      </div>

      <button className="bg-retro-dark text-white px-6 py-2 text-xl hover:bg-retro-primary transition-colors border-2 border-transparent hover:border-retro-dark hover:shadow-pixel">
        Connect Wallet
      </button>
    </nav>
  );
}
