import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-2xl border-4 border-retro-dark p-8 bg-white shadow-pixel">
          <h2 className="text-4xl mb-4">SYSTEM READY...</h2>
          <p className="text-2xl mb-8 opacity-80">
            Build AI Agents with 0% Code and 100% Swagger.
          </p>

          <Link href="/dashboard">
            <button className="bg-retro-primary text-white text-2xl px-8 py-4 border-4 border-retro-dark hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-pixel transition-all">
              START_ENGINE_V1
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
