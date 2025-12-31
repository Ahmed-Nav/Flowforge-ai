"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { logout, isAuthenticated } = useAuth();

  return (
    <nav className="w-full h-16 bg-black border-b border-gray-800 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-xl font-bold text-white tracking-tighter"
        >
          FLOWFORGE<span className="text-red-600">.AI</span>
        </Link>
        {isAuthenticated && (
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white text-sm font-mono uppercase"
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 text-sm font-mono uppercase"
          >
            Disconnect
          </button>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-xs uppercase rounded"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
